<?php

namespace AsyncAPI\Services\MessageBroker;

use RuntimeException;

class ClientConfig
{

    protected array $configs;

    public function __construct(array $configs = [])
    {
        $this->configs = $configs;
    }

    public function get(string $key): mixed
    {
        if (!array_key_exists($key, $this->configs)) {
            throw new RuntimeException("Config $key doesn't exist.");
        }

        return $this->configs[$key];
    }

    public function set(string $key, mixed $value): void
    {
        $this->configs[$key] = $value;
    }

}