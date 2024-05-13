<?php

namespace AsyncAPI\Services\MessageBroker; // TODO: use services namespace value specified as param

use Closure;
use Exception;

interface Client
{

    /**
     * @throws Exception
     */
    function connect(): void;

    function publish(Message $message, Destination $destination): void;

    function subscribe(Destination $destination, Closure $handler): Subscription;

    function listen(): void;

    /**
     * @throws Exception
     */
    function disconnect(): void;

    function isConnected(): bool;

}