<?php

namespace AsyncAPI\Services\MessageBroker;

use Closure;

interface Client
{

    function connect(): void;

    function publish(Message $message, Destination $channel): void;

    function subscribe(Destination $destination, Closure $handler): void;

    function disconnect(): void;

    function isConnected(): bool;

}