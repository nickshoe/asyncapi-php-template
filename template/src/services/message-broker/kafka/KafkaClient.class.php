<?php

namespace AsyncAPI\Services\MessageBroker\Kafka;

use AsyncAPI\Services\MessageBroker\Client;
use AsyncAPI\Services\MessageBroker\Destination;
use AsyncAPI\Services\MessageBroker\Message;
use AsyncAPI\Services\MessageBroker\MessageAckHandler;
use AsyncAPI\Services\MessageBroker\Subscription;
use Closure;
use RuntimeException;

class KafkaClient implements Client
{
    private const CONSUME_TIMEOUT_MS = 120 * 1000;

    private KafkaClientConfig $config;

    private \RdKafka\Conf $rdKafkaConf;
    private \RdKafka\KafkaConsumer $rdKafkaConsumer;

    private Closure $handler;

    private $debug = false;

    public function __construct(KafkaClientConfig $config)
    {
        $this->config = $config;
    }

    public function connect(): void
    {
        $this->rdKafkaConf = new \RdKafka\Conf();

        //$this->rdKafkaConf->set('log_level', (string) LOG_DEBUG); // TODO: expose

        //$this->rdKafkaConf->set('debug', 'all'); // TODO: expose

        // Configure the group.id. All consumer with the same group.id will consume
        // different partitions.
        $this->rdKafkaConf->set('group.id', $this->config->getConsumerGroupId());

        $brokers = explode(',', $this->config->getBrokers());
        $brokersHosts = array_map(fn($broker) => explode(':', $broker)[0], $brokers);
        $brokersList = implode(',', $brokersHosts);
        // Initial list of Kafka brokers
        $this->rdKafkaConf->set('metadata.broker.list', $brokersList);

        // Set where to start consuming messages when there is no initial offset in
        // offset store or the desired offset is out of range.
        // 'earliest': start from the beginning
        $this->rdKafkaConf->set('auto.offset.reset', 'earliest'); // TODO: expose

        // Emit EOF event when reaching the end of a partition
        $this->rdKafkaConf->set('enable.partition.eof', 'true'); // TODO: expose
    }

    public function publish(Message $message, Destination $destination): void
    {

    }

    public function subscribe(Destination $destination, Closure $handler): Subscription
    {
        $this->handler = $handler;

        $this->rdKafkaConsumer = new \RdKafka\KafkaConsumer($this->rdKafkaConf);

        $topicName = $this->builTopicName($destination);
        $this->rdKafkaConsumer->subscribe([$topicName]);

        return new Subscription(0, $destination); // TODO: generate or retrieve a subscription id?
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

    }

    public function isConnected(): bool
    {
        return true;
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