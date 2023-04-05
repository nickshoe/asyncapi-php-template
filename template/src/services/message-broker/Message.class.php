<?php

namespace AsyncAPI\Services\MessageBroker;

class Message
{

    private string $id;
    private string $body;

    public function __construct(string $id, string $body)
    {
        $this->id = $id;
        $this->body = $body;
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getBody(): string
    {
        return $this->body;
    }

}