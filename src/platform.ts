import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { CeilingFanRemote } from './platformAccessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class CeilingFanRemotePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];
  public readonly remotes: CeilingFanRemote[] = [];
  public readonly initializedRemotes: string[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Initializing ceiling fan platform');

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      this.log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.initialize();
      this.log.debug('Finished initializing ceiling fan platform');
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  initialize() {
    this.log.debug('Discovering Devices');

    if(this.config.remotes && Array.isArray(this.config.remotes)) {
      // loop over the discovered devices and register each one if it has not already been registered
      for (const remoteConfig of this.config.remotes) {
        const uuid = this.api.hap.uuid.generate(remoteConfig.remote_id);

        if(this.initializedRemotes.indexOf(uuid)<0) {
          this.initializedRemotes.push(uuid);

          // see if an accessory with the same uuid has already been registered and restored from
          // the cached devices we stored in the `configureAccessory` method above
          const existingAccessoryIndex = this.accessories.findIndex(accessory => accessory.UUID === uuid);
  
          if (existingAccessoryIndex >= 0) {
            // the accessory already exists
            const existingAccessory = this.accessories.splice(existingAccessoryIndex, 1)[0];
  
            this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
  
            // Update the context to make sure the current settings are in the context
            existingAccessory.context.config = remoteConfig;
            this.api.updatePlatformAccessories([existingAccessory]);
  
            this.remotes.push(new CeilingFanRemote(this, existingAccessory));
          } else {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory:', remoteConfig.name);
  
            // create a new accessory
            const accessory = new this.api.platformAccessory(remoteConfig.name, uuid);
            accessory.context.config = remoteConfig;
            this.remotes.push(new CeilingFanRemote(this, accessory));
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
          }
        }
        else {
          this.log.error(`Already initialized a remote with id ${remoteConfig.remote_id}. Remote ID must be unique.`);
        }
      }

      //Add event listener to remotes for transmitting changes to mqtt
      this.remotes.forEach(remote=>{
        remote.addListener('update', props=>{
          this.log.debug('Update received', props);
        });
      });

      //Remove any cached remotes that aren't in the config anymore.
      this.accessories.forEach(existingAccessory=>{
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      });
    }
  }
}
