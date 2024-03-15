import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { CeilingFanRemotePlatform } from './platform';
import EventEmitter from 'node:events';

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
export class CeilingFanRemote extends EventEmitter {
  private name: string;
  private remoteID: string;
  private lightService: Service;
  private fanService: Service;


  private accessoryState:accessoryState = {
    LightOn: false,
    LightBrightness: BrightnessLevels,
    FanOn: 0,
    FanSpeed: FanSpeeds,
  };

  private updateDebouncers:accessoryUpdateDebouncer = {};



  constructor(
    private readonly platform: CeilingFanRemotePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    super();
    
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


        this.emit('update', {remote:this.accessory.context.config.remote_id, parameter:key, value:update[key]});

        if(afterUpdate) {
          afterUpdate();
        }
      }, 1000);
    });
  }

  get config() {
    return this.accessory.context.config;
  }

  async setLightOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    this.updateState({LightOn: value as boolean});

    this.platform.log.debug(`${this.name}.setLightOn(${value})`);
  }

  async getLightOn(): Promise<CharacteristicValue> {
    const isOn = this.accessoryState.LightOn;

    //this.platform.log.debug(`${this.name}.getLightOn() -> ${isOn}`);

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

    return fanSpeed;
  }
  

}
