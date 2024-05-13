<?php

namespace AsyncAPI\Services\MessageBroker; // TODO: use services namespace value specified as param

use RuntimeException;

class Message
{

    private string $id;
    private string $body;
    private bool $alreadyAcked;

    private MessageAckHandler|null $ackHandler = null;

    public function __construct(string $id, string $body)
    {
        $this->id = $id;
        $this->body = $body;
        $this->alreadyAcked = false;
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getBody(): string
    {
        return $this->body;
    }

    public function isAlreadyAcked(): bool
    {
        return $this->alreadyAcked;
    }

    public function setAckHandler(MessageAckHandler $ackHandler): void
    {
        $this->ackHandler = $ackHandler;
    }

    public function ack($throwIfAlreadyAcked = false): void
    {
        if ($this->ackHandler === null) {
            throw new RuntimeException("No ack handler set on the message.");
        }

        if ($this->alreadyAcked) {
            if ($throwIfAlreadyAcked) {
                throw new RuntimeException("Message " . $this->id . " already acked.");
            } else {
                return;
            }
        }

        $this->ackHandler->handleAck();

        $this->alreadyAcked = true;
    }

}

interface MessageAckHandler
{
    public function handleAck(): void;
}