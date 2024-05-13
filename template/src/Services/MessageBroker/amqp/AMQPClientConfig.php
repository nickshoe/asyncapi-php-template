<?php

namespace AsyncAPI\Services\MessageBroker\AMQP; // TODO: use services namespace value specified as param

use AsyncAPI\Services\MessageBroker\ClientConfig;

class AMQPClientConfig extends ClientConfig
{

    public const HOST = 'host';
    public const PORT = 'port';
    public const USER = 'user';
    public const PASSWORD = 'password';

    public function __construct(string $host, int $port, string $user, string $password)
    {
        parent::__construct(
            array(
                self::HOST => $host,
                self::PORT => $port,
                self::USER => $user,
                self::PASSWORD => $password,
            )
        );
    }

    public function getHost(): string
    {
        return $this->get(self::HOST);
    }

    public function getPort(): int
    {
        return $this->get(self::PORT);
    }

    public function getUser(): string
    {
        return $this->get(self::USER);
    }

    public function getPassword(): string
    {
        return $this->get(self::PASSWORD);
    }

}