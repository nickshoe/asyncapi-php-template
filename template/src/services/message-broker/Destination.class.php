<?php

namespace AsyncAPI\Services\MessageBroker;

class Destination
{

    private string $name;
    private array $parameters;

    public function __construct(string $name, array $parameters = [])
    {
        $this->name = $name;
        $this->parameters = $parameters;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getParameters(): array
    {
        return $this->parameters;
    }

}