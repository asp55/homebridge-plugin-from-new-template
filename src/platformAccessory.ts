import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { CeilingFanRemotePlatform } from './platform';
import { after } from 'node:test';

const BrightnessLevels = 8;
const FanSpeeds = 3;

type FanActive = 0 | 1;

interface accessoryState {
  LightOn:boolean; 
  LightBrightness:number;
  FanOn: FanActive;
  FanSpeed: number;
}

interface accessoryStateUpdate {
  LightOn?:boolean; 
  LightBrightness?:number;
  FanOn?: FanActive;
  FanSpeed?: number;
}

type Callback = ()=>unknown;
type optionalCallback = null | Callback;



interface accessoryUpdateDebouncer {
  LightOn?:NodeJS.Timeout; 
  LightBrightness?:NodeJS.Timeout;
  FanOn?: NodeJS.Timeout;
  FanSpeed?: NodeJS.Timeout;
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class CeilingFanRemote {
  private name: string;
  private remoteID: string;
  private lightService: Service;
  private fanService: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */


  private accessoryState:accessoryState = {
    LightOn: false,
    LightBrightness: 100,
    FanOn: 0,
    FanSpeed: 100,
  };

  private updateDebouncers:accessoryUpdateDebouncer = {};



  constructor(
    private readonly platform: CeilingFanRemotePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    this.platform.log.debug('Constructing ceiling fan remote with context:', this.accessory.context);
    this.name = this.accessory.context.config.name;
    this.remoteID = this.accessory.context.config.remote_id;

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Andrew Parnell')
      .setCharacteristic(this.platform.Characteristic.Model, 'Ceiling fan controls')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.remoteID);

    // INITIALIZE LIGHTBULB SERVICE
    (()=>{
      // get the LightBulb service if it exists, otherwise create a new LightBulb service
      this.lightService = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

      // set the service name, this is what is displayed as the default name on the Home app
      this.lightService.setCharacteristic(this.platform.Characteristic.Name, `${this.name} Light`);

      // each service must implement at-minimum the "required characteristics" for the given service type
      // see https://developers.homebridge.io/#/service/Lightbulb

      // register handlers for the On/Off Characteristic
      this.lightService.getCharacteristic(this.platform.Characteristic.On)
        .onSet(this.setLightOn.bind(this))                // SET - bind to the `setLightOn` method below
        .onGet(this.getLightOn.bind(this));               // GET - bind to the `getLightOn` method below

      // register handlers for the Brightness Characteristic
      this.lightService.getCharacteristic(this.platform.Characteristic.Brightness)
        .onSet(this.setLightBrightness.bind(this));       // SET - bind to the 'setLightBrightness` method below

    })();


    // INITIALIZE FAN SERVICE
    (()=>{
      // get the Fan service if it exists, otherwise create a new Fan service
      this.fanService = this.accessory.getService(this.platform.Service.Fanv2) || this.accessory.addService(this.platform.Service.Fanv2);

      // set the service name, this is what is displayed as the default name on the Home app
      this.fanService.setCharacteristic(this.platform.Characteristic.Name, `${this.name} Fan`);

      // register handlers for the Active Characteristic
      this.fanService.getCharacteristic(this.platform.Characteristic.Active)
        .onSet(this.setFanOn.bind(this))                // SET - bind to the `setFanOn` method below
        .onGet(this.getFanOn.bind(this));               // GET - bind to the `getFanOn` method below

      this.fanService.getCharacteristic(this.platform.Characteristic.RotationSpeed)
        .onSet(this.setFanSpeed.bind(this))
        .onGet(this.getFanSpeed.bind(this));

    })();


    //Initialize the state from context
    if(this.accessory.context.state) {
      this.accessoryState = this.accessory.context.state;

      const state = this.accessoryState;

      this.lightService.updateCharacteristic(this.platform.Characteristic.On, state.LightOn);
      this.lightService.updateCharacteristic(this.platform.Characteristic.Brightness, 100*state.LightBrightness/BrightnessLevels);

      this.fanService.updateCharacteristic(this.platform.Characteristic.Active, state.FanOn);
      this.fanService.updateCharacteristic(this.platform.Characteristic.RotationSpeed, 100*state.FanSpeed/FanSpeeds);
    }
    else {
      this.accessory.context.state = this.accessoryState;
      this.platform.api.updatePlatformAccessories([this.accessory]);
    }
    
    /**
     * Updating characteristics values asynchronously.
     */
    // let lightOn = false;
    // setInterval(() => {
    //   // EXAMPLE - inverse the trigger
    //   lightOn = !lightOn;

    //   // push the new value to HomeKit
    //   this.lightService.updateCharacteristic(this.platform.Characteristic.On, lightOn);
    //   this.platform.log.debug('Toggling Light:', lightOn);
    // }, 10000);

  }

  private updateState(update:accessoryStateUpdate, afterUpdate:optionalCallback = null) {
    Object.keys(update).forEach(key=>{
      this.accessoryState[key] = update[key];

      if(this.updateDebouncers[key]) {
        clearTimeout(this.updateDebouncers[key]);
      }
      this.updateDebouncers[key] = setTimeout(()=>{

        //Update the accessory context

        this.accessory.context.state = this.accessoryState;
        this.platform.api.updatePlatformAccessories([this.accessory]);

        if(afterUpdate) {
          afterUpdate();
        }
      }, 1000);
    });
  }

  async setLightOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    this.updateState({LightOn: value as boolean});

    this.platform.log.debug(`${this.name}.setLightOn(${value})`);
  }

  async getLightOn(): Promise<CharacteristicValue> {
    const isOn = this.accessoryState.LightOn;

    //this.platform.log.debug(`${this.name}.getLightOn() -> ${isOn}`);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return isOn;
  }

  async setLightBrightness(value: CharacteristicValue) {
    const newBrightness = Math.round((value as number)/100 * BrightnessLevels);
    const snapValue = Math.round(100*(newBrightness/BrightnessLevels));

    this.platform.log.debug(`${this.name}.setLightBrightness(${value}) -> ${newBrightness}`);

    if(newBrightness!==0) {
      //If the new brightness is 0, we're not going to actually save it to the state. So that if the light is just turned on we can return to the last brightness that was set.

      this.updateState(
        {LightBrightness: newBrightness},
        ()=>{
          //After debounce snap the value
          this.platform.log.debug(`${this.name}.snapLightBrightness(${value}) -> ${snapValue}%`);
          this.lightService.updateCharacteristic(this.platform.Characteristic.Brightness, snapValue);
        }
      );
    }

    
  }

  async getLightBrightness(): Promise<CharacteristicValue> {
    const brightness = this.accessoryState.LightOn ? 100*(this.accessoryState.LightBrightness/BrightnessLevels) : 0;

    //this.platform.log.debug(`${this.name}.getLightBrightness() -> ${brightness}`);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return brightness;
  }


  async setFanOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    this.updateState({FanOn: value as FanActive});

    this.platform.log.debug(`${this.name}.setFanOn(${value})`);
  }

  async getFanOn(): Promise<CharacteristicValue> {
    const isOn = this.accessoryState.FanOn;

    //this.platform.log.debug(`${this.name}.getFanOn() -> ${isOn}`);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return isOn;
  }
  
  async setFanSpeed(value: CharacteristicValue) {
    const newSpeed = Math.round((value as number)/100 * FanSpeeds);
    const snapValue = Math.round(100*(newSpeed/FanSpeeds));
    this.platform.log.debug(`${this.name}.setFanSpeed(${value}) -> ${newSpeed} || ${snapValue}%`);

    if(newSpeed!==0) {
      //If the new speed is 0, we're not going to actually save it to the state. 
      // So that if the fan is just turned on we can return to the last speed that was set.

      this.updateState(
        {FanSpeed: newSpeed},
        ()=>{
          //After debounce snap the value
          this.platform.log.debug(`${this.name}.snapFanSpeed(${value}) -> ${snapValue}%`);
          this.fanService.updateCharacteristic(this.platform.Characteristic.RotationSpeed, snapValue);
        }
      );
    }

  }

  async getFanSpeed(): Promise<CharacteristicValue> {
    const fanSpeed = this.accessoryState.FanOn ? 100*(this.accessoryState.FanSpeed/FanSpeeds) : 0;

    //this.platform.log.debug(`${this.name}.getFanSpeed() -> ${fanSpeed}`);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return fanSpeed;
  }
  

}
