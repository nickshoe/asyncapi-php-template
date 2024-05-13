<?php

namespace AsyncAPI\Services\MessageBroker\Kafka; // TODO: use services namespace value specified as param

use AsyncAPI\Services\MessageBroker\Client;
use AsyncAPI\Services\MessageBroker\Destination;
use AsyncAPI\Services\MessageBroker\Message;
use AsyncAPI\Services\MessageBroker\MessageAckHandler;
use AsyncAPI\Services\MessageBroker\Subscription;
use Closure;
use RuntimeException;

class KafkaClient implements Client
{
    private const PRODUCE_TIMEOUT_MS = 10 * 1000;
    private const CONSUME_TIMEOUT_MS = 120 * 1000;

    private KafkaClientConfig $config;

    private \RdKafka\Conf $rdKafkaConsumerConf;
    private \RdKafka\Conf $rdKafkaProducerConf;
    private \RdKafka\Producer|null $rdKafkaProducer;
    private \RdKafka\KafkaConsumer|null $rdKafkaConsumer;

    private Closure $handler;

    private $connected = false;
    private $debug = false;

    public function __construct(KafkaClientConfig $config)
    {
        $this->config = $config;

        $this->rdKafkaProducer = null;
        $this->rdKafkaConsumer = null;
    }

    public function connect(): void
    {
        if ($this->isConnected()) {
            throw new RuntimeException("Already connected.");
        }

        $this->connected = true;
    }

    public function publish(Message $message, Destination $destination): void
    {
        if ($this->rdKafkaProducer !== null) { // TODO: handle multiple producer with a single client
            throw new RuntimeException("The publish method have been already invoked before.");
        }

        $this->rdKafkaProducerConf = $this->buildRdKafkaProducerConf($this->config);

        $this->rdKafkaProducer = new \RdKafka\Producer($this->rdKafkaProducerConf);

        $topicName = $this->builTopicName($destination); // TODO: use a map to track producers by topic name
        $topic = $this->rdKafkaProducer->newTopic($topicName);

        $topic->produce(RD_KAFKA_PARTITION_UA, 0, $message->getBody(), $message->getId() !== '' ? $message->getId() : null);
        
        // For non-blocking calls, provide 0 as \p timeout_ms. (https://github.com/confluentinc/librdkafka/blob/master/src/rdkafka.h)
        $this->rdKafkaProducer->poll(0);
    }

    private function buildRdKafkaProducerConf(KafkaClientConfig $config): \RdKafka\Conf
    {
        $rdKafkaConsumerConf = new \RdKafka\Conf();

        //$rdKafkaConsumerConf->set('log_level', (string) LOG_DEBUG); // TODO: expose

        //$rdKafkaConsumerConf->set('debug', 'all'); // TODO: expose

        $brokers = explode(',', $this->config->getBrokers());
        $brokersHosts = array_map(fn($broker) => explode(':', $broker)[0], $brokers);
        $brokersList = implode(',', $brokersHosts);
        // Initial list of Kafka brokers
        $rdKafkaConsumerConf->set('metadata.broker.list', $brokersList);

        return $rdKafkaConsumerConf;
    }

    public function subscribe(Destination $destination, Closure $handler): Subscription
    {
        if ($this->rdKafkaConsumer !== null) { // TODO: handle multiple subscription with a single client
            throw new RuntimeException("The subscribe method have been already invoked before.");
        }

        $this->rdKafkaConsumerConf = $this->buildRdKafkaConsumerConf($this->config);

        $this->rdKafkaConsumer = new \RdKafka\KafkaConsumer($this->rdKafkaConsumerConf);

        $this->handler = $handler; // TODO: use a map to track subscription handler by topic name (i.e. rdKafkaConsumer->getSubscription() value)

        $topicName = $this->builTopicName($destination);
        $this->rdKafkaConsumer->subscribe([$topicName]);

        $subscriptions = $this->rdKafkaConsumer->getSubscription();
        $subscriptionId = array_search($topicName, $subscriptions);

        if ($subscriptionId === false) {
            throw new RuntimeException("Something went wrong while subscribing to topic $topicName.");
        }

        return new Subscription($subscriptionId, $destination);
    }

    private function buildRdKafkaConsumerConf(KafkaClientConfig $config): \RdKafka\Conf
    {
        $rdKafkaConsumerConf = new \RdKafka\Conf();

        //$rdKafkaConsumerConf->set('log_level', (string) LOG_DEBUG); // TODO: expose

        //$rdKafkaConsumerConf->set('debug', 'all'); // TODO: expose

        // Configure the group.id. All consumer with the same group.id will consume
        // different partitions.
        $rdKafkaConsumerConf->set('group.id', $config->getConsumerGroupId());

        $brokers = explode(',', $this->config->getBrokers());
        $brokersHosts = array_map(fn($broker) => explode(':', $broker)[0], $brokers);
        $brokersList = implode(',', $brokersHosts);
        // Initial list of Kafka brokers
        $rdKafkaConsumerConf->set('metadata.broker.list', $brokersList);

        // Set where to start consuming messages when there is no initial offset in
        // offset store or the desired offset is out of range.
        // 'earliest': start from the beginning
        $rdKafkaConsumerConf->set('auto.offset.reset', 'earliest'); // TODO: expose

        // Emit EOF event when reaching the end of a partition
        $rdKafkaConsumerConf->set('enable.partition.eof', 'true'); // TODO: expose

        return $rdKafkaConsumerConf;
    }

    private function builTopicName(Destination $destination): string
    {
        $topicName = $destination->getName();

        foreach ($destination->getParameters() as $parameterName => $parameterValue) {
            $topicName = preg_replace("/\{$parameterName\}/", $parameterValue, $topicName);
        }

        return $topicName;
    }

    public function listen(): void
    {
        $this->log("Waiting for partition assignment... (make take some time when quickly re-joining the group after leaving it.)\n");

        while (true) {
            $rdKafkaMessage = $this->rdKafkaConsumer->consume(self::CONSUME_TIMEOUT_MS);

            switch ($rdKafkaMessage->err) {
                case RD_KAFKA_RESP_ERR_NO_ERROR:
                    $messageId = $rdKafkaMessage->key !== null ? $rdKafkaMessage->key : '';
                    $messageBody = $rdKafkaMessage->payload;
                    $message = new Message($messageId, $messageBody);

                    $message->setAckHandler(new RdKafkaMessageAckHandler($rdKafkaMessage));

                    call_user_func($this->handler, $message);
                    break;
                case RD_KAFKA_RESP_ERR__PARTITION_EOF:
                    $this->log("No more messages; will wait for more\n");
                    break;
                case RD_KAFKA_RESP_ERR__TIMED_OUT:
                    $this->log("Timed out\n");
                    break;
                default:
                    throw new RuntimeException($rdKafkaMessage->errstr(), $rdKafkaMessage->err);
            }
        }
    }

    public function disconnect(): void
    {
        if (!$this->isConnected()) {
            throw new RuntimeException("Not connected.");
        }

        if ($this->rdKafkaProducer !== null) {
            for ($flushRetries = 0; $flushRetries < 10; $flushRetries++) {
                $result = $this->rdKafkaProducer->flush(self::PRODUCE_TIMEOUT_MS);
                if (RD_KAFKA_RESP_ERR_NO_ERROR === $result) {
                    break;
                }
            }
            
            if (RD_KAFKA_RESP_ERR_NO_ERROR !== $result) {
                throw new RuntimeException('Was unable to flush, messages might be lost!');
            }
        }

        if ($this->rdKafkaConsumer !== null) {
            $this->rdKafkaConsumer->unsubscribe();
            $this->rdKafkaConsumer->close();
        }

        $this->connected = false;
    }

    public function isConnected(): bool
    {
        return $this->connected;
    }

    private function log(string $message): void
    {
        if ($this->debug) {
            echo $message;
        }
    }

}

class RdKafkaMessageAckHandler implements MessageAckHandler
{
    private \RdKafka\Message $rdKafkaMessage;

    public function __construct(\RdKafka\Message $rdKafkaMessage)
    {
        $this->rdKafkaMessage = $rdKafkaMessage;
    }

    public function handleAck(): void
    {
        // TODO: should ack?
    }
}