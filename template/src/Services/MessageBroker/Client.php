<?php

namespace AsyncAPI\Services\MessageBroker; // TODO: create a generator param

use Closure;
use Exception;

interface Client
{

    /**
     * @throws Exception
     */
    function connect(): void;

    function publish(Message $message, Destination $channel): void;

    function subscribe(Destination $destination, Closure $handler): Subscription;

    function listen(): void;

    /**
     * @throws Exception
     */
    function disconnect(): void;

    function isConnected(): bool;

}