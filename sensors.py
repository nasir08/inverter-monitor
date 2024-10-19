import logging
from homeassistant.helpers.entity import Entity
from homeassistant.components.rest import RestData
from homeassistant.helpers import discovery

_LOGGER = logging.getLogger(__name__)

# Define your sensor class
class InverterSensor(Entity):
    def __init__(self, name, resource, value_template):
        self._name = name
        self._resource = resource
        self._value_template = value_template
        self._state = None

    @property
    def name(self):
        return self._name

    @property
    def state(self):
        return self._state

    def update(self):
        data = self._resource.update()  # Fetch data from the REST API
        if data:
            self._state = self._value_template(data)

# Setup the sensor
def setup(hass, config):
    resource = RestData("GET", "http://localhost:80/api/inverter-stats", None)
    sensors = [
        InverterSensor("Inverter Voltage", resource, lambda x: x['voltage']),
        InverterSensor("Inverter Current", resource, lambda x: x['current']),
        InverterSensor("Inverter Power", resource, lambda x: x['power']),
        InverterSensor("Inverter Battery Level", resource, lambda x: x['batteryLevel']),
    ]

    # Add sensors to Home Assistant
    for sensor in sensors:
        hass.states.set(f'sensor.{sensor.name.lower().replace(" ", "_")}', sensor.state)

    return True