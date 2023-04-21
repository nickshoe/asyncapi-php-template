<?php

namespace AsyncAPI\Services\MessageBroker\AMQP;

use AsyncAPI\Services\MessageBroker\Client;
use AsyncAPI\Services\MessageBroker\Destination;
use AsyncAPI\Services\MessageBroker\Message;
use AsyncAPI\Services\MessageBroker\Subscription;
use Closure;
use PhpAmqpLib\Channel\AMQPChannel;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use RuntimeException;

class AMQPClient implements Client
{

    private AMQPClientConfig $config;

    private ?AMQPStreamConnection $connection = null;
    private ?AMQPChannel $channel = null;

    private bool $shouldDeclareDestination = false; // TODO: make it configurable

    public function __construct(AMQPClientConfig $config)
    {
        $this->config = $config;
    }

    public function connect(): void
    {
        if ($this->channel !== null) {
            if ($this->channel->is_open()) {
                throw new RuntimeException("Channel already opened.");
            }
        }

        if ($this->connection != null) {
            if ($this->connection->isConnected()) {
                throw new RuntimeException("Already connected.");
            }
        }

        $this->connection = new AMQPStreamConnection(
            $this->config->getHost(),
            $this->config->getPort(),
            $this->config->getUser(),
            $this->config->getPassword()
        );

        $this->channel = $this->connection->channel();
    }

    public function publish(Message $message, Destination $destination): void
    {
        $this->handleOptionalQueueDeclaration($destination);

        $amqpMessage = new AMQPMessage($message->getBody(), ['message_id' => $message->getId()]);

        $this->channel->basic_publish($amqpMessage, '', $destination->getName());
    }

    public function subscribe(Destination $destination, Closure $handler): Subscription
    {
        $this->handleOptionalQueueDeclaration($destination);

        $queueName = $this->buildQueueName($destination);

        $consumerTag = $this->channel->basic_consume(
            $queueName,
            '',
            false,
            true, // TODO: expose message acknowledgement in the API
            false,
            false,
            function (AMQPMessage $amqpMessage) use ($handler) {
                $message = new Message('', $amqpMessage->getBody());

                call_user_func($handler, $message);
            }
        );

        return new Subscription($consumerTag, $destination);
    }

    private function buildQueueName(Destination $destination): string
    {
        $queueName = $destination->getName();

        foreach ($destination->getParameters() as $parameterName => $parameterValue) {
            $queueName = preg_replace("/\{$parameterName\}/", $parameterValue, $queueName);
        }

        return $queueName;
    }

    public function listen(): void
    {
        while ($this->channel->is_open()) {
            $this->channel->wait();
        }
    }

    public function disconnect(): void
    {
        if ($this->connection == null) {
            throw new RuntimeException("Connection is null.");
        }

        if (!$this->connection->isConnected()) {
            throw new RuntimeException("Connection is not established.");
        }

        if ($this->channel == null) {
            throw new RuntimeException("Channel is null.");
        }

        if (!$this->channel->is_open()) {
            throw new RuntimeException("Channel is not opened.");
        }

        $this->channel->close();

        $this->connection->close();
    }

    public function isConnected(): bool
    {
        return $this->connection->isConnected();
    }

    private function handleOptionalQueueDeclaration(Destination $destination): void
    {
        if ($this->shouldDeclareDestination) {
            // Declaring a queue is idempotent - it will only be created if it doesn't exist already.
            $this->channel->queue_declare(
                $destination->getName(),
                false,
                true,
                false,
                false
            );
        }
    }

}