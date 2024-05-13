<?php

namespace AsyncAPI\Services\MessageBroker\AMQP; // TODO: use services namespace value specified as param

use AsyncAPI\Services\MessageBroker\MessageAckHandler;
use PhpAmqpLib\Message\AMQPMessage;

class AMQPMessageAckHandler implements MessageAckHandler
{
    private AMQPMessage $amqpMessage;

    public function __construct(AMQPMessage $amqpMessage)
    {
        $this->amqpMessage = $amqpMessage;
    }

    public function handleAck(): void
    {
        $this->amqpMessage->ack();
    }
}
