import { useEffect, useState } from "react";

const homebridge = window.homebridge;

function App() {
  const [pluginConfig, setPluginConfig] = useState({});
  const [initialized, setInitialized] = useState(false);

  useEffect(()=>{
    if(initialized) homebridge.updatePluginConfig([pluginConfig]);
  }, [pluginConfig, initialized]);

  useEffect(()=>{
    homebridge.showSpinner();
    Promise.all([homebridge.getPluginConfig(), homebridge.getPluginConfigSchema()])
    .then(results=>{
      console.log("Results: ",results);
      const _pluginConfig = results[0][0];
      const _pluginConfigSchema = results[1];

      const unpackSchema = (schemaNode, configNode)=>{
        if(schemaNode.type==="object") {
            return Object.keys(schemaNode.properties).reduce((a,c)=>{
                const output = {...a};
                
                const _configNode = configNode && configNode[c] ? configNode[c] : undefined;

                if(c !== "_bridge") output[c] = unpackSchema(schemaNode.properties[c], _configNode);
                return output;
            }, {})
        }
        else if(schemaNode.type==="array") {
          if(Array.isArray(configNode)) return configNode.map(v=>unpackSchema(schemaNode.items, v));
          else return [];
        }
        else {
          return configNode !== undefined ? configNode : schemaNode.default ?? '';
        }
      }

      const initialSchema = unpackSchema(_pluginConfigSchema.schema, _pluginConfig);

      setPluginConfig(initialSchema);
      setInitialized(true)
      homebridge.hideSpinner();
    })
  }, [setPluginConfig, setInitialized]);

  const removeRemote = (i)=>{
    const update = JSON.parse(JSON.stringify(pluginConfig));
    update.remotes.splice(i,1);
    setPluginConfig(update);
  };

  const updateRemote = (i, key, value)=>{
    const update = JSON.parse(JSON.stringify(pluginConfig));
    update.remotes[i][key] = value;
    setPluginConfig(update);
  };

  const addRemote = ()=>{
    const update = JSON.parse(JSON.stringify(pluginConfig));
    update.remotes.push({
      name:'',
      remote_id: '',
      _id: Date.now()
    });
    setPluginConfig(update);
  }

  const updateMQTT = (key, value)=>{
    const update = JSON.parse(JSON.stringify(pluginConfig));
    update.mqtt[key] = value;
    setPluginConfig(update);
  }

  const updateRFBridge = (key, value)=>{
    const update = JSON.parse(JSON.stringify(pluginConfig));
    update.rfbridge[key] = value;
    setPluginConfig(update);
  }

  if(!initialized) {
    return (<div>Initializing</div>);
  }
  else {
    const remotes = pluginConfig.remotes.map((v,i)=>{
      return (<div key={`remote-${i}`}>
        <div className="list-group-item mb-3">
          <button type="button" id="removeRemote1710906152345" className="close pull-right" onClick={()=>removeRemote(i)}>
            <span aria-hidden="true">×</span><span className="sr-only">Remove</span>
          </button>
          <div className="form-group">
              <label className="control-label" htmlFor="remoteName1710906152345">Name <strong className="text-danger">*</strong></label>
              <input className="form-control" id="remoteName1710906152345" name="name" type="text" required={true} value={v.name} onChange={e=>updateRemote(i,'name',e.target.value)}/>
          </div>
          <div className="form-group">
              <label className="control-label" htmlFor="remoteID1710906152345">Remote ID <strong className="text-danger">*</strong></label>
              <input className="form-control" id="remoteID1710906152345" name="remote_id" type="text" required={true} value={v.remote_id}  onChange={e=>updateRemote(i,'remote_id',e.target.value)}/>
              <p className="help-block">
                Nibble 1-40 of remote payload. Use either HEX or Binary representation.<br />
                Example: 0010101110101001001111001110001110111101
              </p>
          </div>
        </div>
      </div>);
    });

    return (
    <form id="configForm" autoComplete="off">
      <div className="card card-body mb-4">
          <label style={{fontSize:"1.5rem"}}>MQTT</label>
          <div className="form-group">
            <label className="control-label" htmlFor="mqttProtocol">Protocol <strong className="text-danger">*</strong></label>
            <select className="form-control" id="mqttProtocol" name="protocol" required={true} defaultValue={pluginConfig.mqtt.protocol} onChange={e=>updateMQTT('protocol',e.target.value)}>
              <option value="mqtt">mqtt</option>
              <option value="mqtts">mqtts</option>
              <option value="tcp">tcp</option>
              <option value="tls">tls</option>
              <option value="ws">ws</option>
              <option value="wss">wss</option>
              <option value="wxs">wxs</option>
              <option value="alis">alis</option>
            </select>
          </div>
          <div className="form-group">
              <label className="control-label" htmlFor="mqttBroker">Broker <strong className="text-danger">*</strong></label>
              <input className="form-control" id="mqttBroker" name="host" type="text" required={true} value={pluginConfig.mqtt.host} onChange={e=>updateMQTT('host',e.target.value)} />
          </div>
          <div className="form-group">
              <label className="control-label" htmlFor="mqttPort">Port <strong className="text-danger">*</strong></label>
              <input className="form-control" id="mqttPort" name="port" type="text" required={true} value={pluginConfig.mqtt.port} onChange={e=>updateMQTT('port',e.target.value)} />
          </div>
          <div className="form-group">
              <label className="control-label" htmlFor="mqttUsername">Username</label>
              <input className="form-control" id="mqttUsername" name="user" type="text" required={false} value={pluginConfig.mqtt.user} onChange={e=>updateMQTT('user',e.target.value)} />
          </div>
          <div className="form-group">
              <label className="control-label" htmlFor="mqttPassword">Password</label>
              <input className="form-control" id="mqttPassword" name="password" type="text" required={false} value={pluginConfig.mqtt.password} onChange={e=>updateMQTT('password',e.target.value)} />
          </div>
      </div>
      <div className="card card-body mb-4">
          <label style={{fontSize:"1.5rem"}}>RF Bridge</label>
          <div className="form-group">
              <label className="control-label" htmlFor="rfbridgeTopic">Topic <strong className="text-danger">*</strong></label>
              <input className="form-control" id="rfbridgeTopic" name="topic" type="text" required={true} value={pluginConfig.rfbridge.topic} onChange={e=>updateRFBridge('topic',e.target.value)} />
          </div>
          <div className="form-group">
              <label className="control-label" htmlFor="rfbridgeProtocol">Protocol Index <strong className="text-danger">*</strong></label>
              <input className="form-control" id="rfbridgeProtocol" name="protocol" type="text" required={true} value={pluginConfig.rfbridge.protocol} onChange={e=>updateRFBridge('protocol',e.target.value)} />
          </div>
      </div>
      <div className="card card-body mb-4">
        <div className="list-group">
          <fieldset>
            <legend>Remotes</legend>
            <div id="remotes">
              {remotes}
            </div>
            <div className="form-group">
              <button id="addRemote" className="btn btn-default fa-pull-right" onClick={addRemote} >Add Remote</button>
            </div>
          </fieldset>
        </div>
      </div>
    </form>
    );
  }
}

export default App;
