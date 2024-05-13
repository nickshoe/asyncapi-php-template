<?php

namespace AsyncAPI\Services\MessageBroker\Kafka; // TODO: use services namespace value specified as param

use AsyncAPI\Services\MessageBroker\MessageAckHandler;

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
