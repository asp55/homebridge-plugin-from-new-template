# homebridge-mqtt-ceiling-fan-remote

[![npm](https://img.shields.io/npm/v/homebridge-mqtt-ceiling-fan-remote) ![npm](https://img.shields.io/npm/dt/homebridge-mqtt-ceiling-fan-remote)](https://www.npmjs.com/package/homebridge-mqtt-ceiling-fan-remote)

[Homebridge](https://github.com/homebridge/homebridge) Support for wireless control of Hunter ceiling fans via a [Tasmotized](https://github.com/arendst/Tasmota) Sonoff [RF Bridge](https://sonoff.tech/product/gateway-and-sensors/rf-bridger2/) with [Portisch firmware](https://github.com/Portisch/RF-Bridge-EFM8BB1)

## Prerequisites 
- A Sonoff [RF Bridge](https://sonoff.tech/product/gateway-and-sensors/rf-bridger2/) with [Portisch firmware compiled to include the Hunter Fan Protocol](https://github.com/asp55/homebridge-mqtt-ceiling-fan-remote/blob/latest/portische/RF-Bridge-EFM8BB1.hex) 
- A MQTT Broker such as [Mosquitto](https://mosquitto.org) or (homebridge-aedes)[https://github.com/kevinkub/homebridge-aedes]


## Installation

1. Set up the RF Bridge using the [official instructions](https://tasmota.github.io/docs/devices/Sonoff-RF-Bridge-433/)
   - Upgrade the [RF Firmware](https://tasmota.github.io/docs/devices/Sonoff-RF-Bridge-433/#rf-firmware-upgrade) with the [included version of the Portische firmware](https://github.com/asp55/homebridge-mqtt-ceiling-fan-remote/blob/latest/portische/RF-Bridge-EFM8BB1.hex)
2. Install Homebridge using the [official instructions](https://github.com/homebridge/homebridge/wiki).
3. Install this plugin using: `sudo npm install -g homebridge-mqtt-ceiling-fan-remote`.
4. Configure the plugin via the config-ui
