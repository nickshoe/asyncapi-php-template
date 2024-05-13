<?php

namespace AsyncAPI\Services\MessageBroker\Kafka;

use AsyncAPI\Services\MessageBroker\ClientConfig;

class KafkaClientConfig extends ClientConfig
{

    public const BROKERS = 'brokers';
    public const CONSUMER_GROUP_ID = 'consumer.group.id';

    public function __construct(string $brokers, ?string $consumerGroupId = null)
    {
        parent::__construct(
            array(
                self::BROKERS => $brokers,
                self::CONSUMER_GROUP_ID => $consumerGroupId
            )
        );
    }

    public function getBrokers(): string
    {
        return $this->get(self::BROKERS);
    }

    public function getConsumerGroupId(): ?string
    {
        return $this->get(self::CONSUMER_GROUP_ID);
    }

}