<?php

namespace AsyncAPI\Services\MessageBroker;

class Subscription
{

    private readonly string $id;
    private readonly Destination $destination;

    public function __construct(string $id, Destination $destination)
    {
        $this->id = $id;
        $this->destination = $destination;
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getDestination(): Destination
    {
        return $this->destination;
    }

}