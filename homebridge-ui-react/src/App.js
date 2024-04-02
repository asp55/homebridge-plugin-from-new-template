import './App.css';
import { useEffect, useState } from "react";
import RemoteIDField from "./components/RemoteIDField/RemoteIDField";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import reorder from "./utils/reorder";
import {ReactComponent as DragHandle} from "./assets/drag-handle.svg";


const homebridge = window.homebridge;

function App() {
  const [pluginConfig, setPluginConfig] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [sniffingRoom, setSniffingRoom] = useState(-1);
  const [sniffingRemote, setSniffingRemote] = useState(-1);
  const [waitingForSniff, setWaitingForSniff] = useState(false);
  const [draggingRemoteRoom, setDraggingRemoteRoom] = useState(-1);
  const [draggingRemote, setDraggingRemote] = useState(-1);

  useEffect(()=>{
    if(initialized) {
      const config = JSON.parse(JSON.stringify(pluginConfig));
      config.rooms = config.rooms.map(room=>{
        const remote_ids = room.remote_ids.map(remote_id=>remote_id.value);
        return {...room, remote_ids:remote_ids};
      })
      homebridge.updatePluginConfig([config]);
    }
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

      const updatedRooms = initialSchema.rooms.map(room=>{
        const remote_ids = room.remote_ids.map(remote_id=>{return {value:remote_id, key:Date.now()}});
        return {...room, remote_ids:remote_ids};
      })
      initialSchema.rooms = updatedRooms;
      

      initialSchema._version = "1.0.0";
      setPluginConfig(initialSchema);
      setInitialized(true)
      homebridge.hideSpinner();
    })
  }, [setPluginConfig, setInitialized]);

  const hasSniffingParams = pluginConfig.mqtt && pluginConfig.mqtt.protocol && pluginConfig.mqtt.host && pluginConfig.mqtt.port && pluginConfig.rfbridge && pluginConfig.rfbridge.topic;

  useEffect(()=>{
    if(sniffingRoom > -1 && sniffingRemote > -1 && !waitingForSniff) {
      setWaitingForSniff(true);
      console.log("Begin Sniffing");
      const targetRoom = sniffingRoom;
      const targetRemote = sniffingRemote;
      const targetRoomName = pluginConfig.rooms[targetRoom] ? pluginConfig.rooms[targetRoom].name : 'Unnamed';

      homebridge.toast.info(`Begin sniffing for #${targetRemote+1} in Room ${targetRoomName}. This will timeout in 5 minutes.`);

      homebridge.request('/sniff', { mqtt: pluginConfig.mqtt, rfbridge: pluginConfig.rfbridge }).then(
        response => {
          console.log("Receied response", response)
          setWaitingForSniff(false);
          setSniffingRoom(-1);
          setSniffingRemote(-1);

          if(response.result==='success') {
            const update = JSON.parse(JSON.stringify(pluginConfig));
            if(update.rooms[targetRoom] && update.rooms[targetRoom].remote_ids[targetRemote]) update.rooms[targetRoom].remote_ids[targetRemote] = response.data;
            setPluginConfig(update);
            homebridge.toast.success(`Updated Remote ID for Remote #${targetRemote+1} in Room ${targetRoomName}`)
          }
          else if(response.result==='timeout') {
            homebridge.toast.warn('Sniffing timed out');
          }
          else if(response.result==='error') {
            if(response.data.code==='ECONNREFUSED') {
              homebridge.toast.error('Please verify your MQTT settings.', 'Connection Refused');

            }
            else {
              homebridge.toast.error(JSON.stringify(response.data), 'Unknown Error');
            }
          }

        }
      )
    }
    else {
    }

  }, [pluginConfig, sniffingRoom, sniffingRemote, waitingForSniff]);

  const onDragEnd = (room, result)=>{
    setDraggingRemoteRoom(-1);
    setDraggingRemote(-1);

    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const update = JSON.parse(JSON.stringify(pluginConfig));
    update.rooms[room].remote_ids = reorder(update.rooms[room].remote_ids, result.source.index, result.destination.index);
    setPluginConfig(update);
    
  }

  function onDragStart(room, e) {
    setDraggingRemoteRoom(room);
    setDraggingRemote(e.source.index);
  }

  const removeRoom = (i)=>{
    const update = JSON.parse(JSON.stringify(pluginConfig));
    update.rooms.splice(i,1);
    setPluginConfig(update);
  };

  const updateRoom = (i, key, value)=>{
    const update = JSON.parse(JSON.stringify(pluginConfig));
    update.rooms[i][key] = value;
    setPluginConfig(update);
  };

  const addRoom = ()=>{
    const update = JSON.parse(JSON.stringify(pluginConfig));
    update.rooms.push({
      _id: Date.now(),
      name:'',
      remote_ids: [{value:" ", key:Date.now()}]
    });
    setPluginConfig(update);
  }

  const removeRemote = (roomNum, remoteNum)=>{
    const update = JSON.parse(JSON.stringify(pluginConfig));
    update.rooms[roomNum].remote_ids.splice(remoteNum,1);
    setPluginConfig(update);
  }

  const updateRemote = (roomNum, remoteNum, value)=>{
    const update = JSON.parse(JSON.stringify(pluginConfig));
    update.rooms[roomNum].remote_ids[remoteNum].value = value;
    setPluginConfig(update);
  };

  const addRemote = (roomNum)=>{
    const update = JSON.parse(JSON.stringify(pluginConfig));
    update.rooms[roomNum].remote_ids.push({value:'', key:Date.now()});
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
  const updateNames = (value)=>{
    const update = JSON.parse(JSON.stringify(pluginConfig));
    update.name = value;
    setPluginConfig(update);
  }

  if(!initialized) {
    return (<div>Initializing</div>);
  }
  else {
    const rooms = (pluginConfig.rooms && Array.isArray(pluginConfig.rooms)) ? pluginConfig.rooms.map((room, i)=>{

      const multipleRemotes = room.remote_ids.length > 1;

      const remoteContainerClass = ['remotes'];
      if(draggingRemoteRoom===i) remoteContainerClass.push('dragContainer');

      const remotes = (room.remote_ids && Array.isArray(room.remote_ids)) ? room.remote_ids.map((remote,j)=>{
        const removeButton = multipleRemotes ? 
          (
            <button type="button" id={`remove-room-${i}-remote-${j}`} className="close pull-right ml-3" onClick={()=>removeRemote(i,j)}>
              <span aria-hidden="true">×</span><span className="sr-only">Remove</span>
            </button>
          ) 
          : '';

          const rowClassName = ['px-3','py-2','remote'];

          if(draggingRemoteRoom===i && draggingRemote===j) rowClassName.push('dragging');
          
          return (
            <Draggable key={`room-${i}-remote-${remote.key}}`} draggableId={`room-${i}-remote-${remote.key}`} index={j} >
              {provided => (
                <div
                ref={provided.innerRef} 
                {...provided.draggableProps}>
                  <div 
                    className={rowClassName.join(" ")} 
                    style={{
                      display: "grid", 
                      gridTemplateColumns: multipleRemotes ? "min-content 1fr min-content" : "1fr min-content",
                      alignItems: "center"
                    }}
                    
                  >
                    <div {...provided.dragHandleProps} style={{display: multipleRemotes ? "block" : "none", paddingRight:"0.5rem"}}><DragHandle /></div>
                    <RemoteIDField 
                        id={`remote-ID-${i}-${remote.key}`} 
                        value={remote.value}
                        onChange={e=>updateRemote(i, j, e.target.value)}
                        canSniff={hasSniffingParams && sniffingRoom<0} 
                        onSniff={()=>{
                          setSniffingRoom(i);
                          setSniffingRemote(j);
                        }}
                        sniffing={sniffingRoom===i&&sniffingRemote===j}
                      />
                    {removeButton}
                  </div>
                  </div>
              )}
            </Draggable>
          )
      }) 
      : '';

      return (
        <div key={`room-${i}`}>
          <div className="list-group-item mb-3">
            <button type="button" id={`remove-room-${i}`} className="close pull-right" onClick={()=>removeRoom(i)}>
              <span aria-hidden="true">×</span><span className="sr-only">Remove</span>
            </button>
            <div className="form-group">
                <label className="control-label" htmlFor={`room-NAME-${i}`}>Name <strong className="text-danger">*</strong></label>
                <input className="form-control" id={`room-NAME-${i}`} name="name" type="text" required={true} value={room.name} onChange={e=>updateRoom(i,'name',e.target.value)}/>
            </div>
            <div className="list-group">
              <label className="control-label">Remotes <strong className="text-danger">*</strong></label>
              <p className="help-block">
                Homekit inputs will be sent from the first remote code
              </p>
              <div className="list-group-item">
                <fieldset>
                  <label className="control-label">Remote Code <strong className="text-danger">*</strong></label>
                  <p className="help-block">
                    Binary string of nibble 1-40 of remote payload. (<strong>Example:</strong> 0010101110101001001111001110001110111101)
                  </p>
                  <DragDropContext onDragStart={e=>onDragStart(i,e)} onDragEnd={(result)=>onDragEnd(i, result)}>
                    <Droppable droppableId="list">
                      {provided => (
                        <div id={`room-${i}-remotes`} className={remoteContainerClass.join(" ")} ref={provided.innerRef} {...provided.droppableProps}>
                          {remotes}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                  <div className="form-group">
                    <button id={`room-${i}-addRemote`} className="btn btn-link mx-0 p-0 fa-pull-right" onClick={()=>addRemote(i)} >Add Remote</button>
                  </div>
                  
                </fieldset>
              </div>
            </div>
          </div>
        </div>
      );

    }) 
    : '';

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
            <legend>Rooms</legend>
            <div id="rooms">
              {rooms}
            </div>
            <div className="form-group">
              <button id="addRoom" className="btn btn-default fa-pull-right" onClick={addRoom} >Add Room</button>
            </div>
          </fieldset>
        </div>
      </div>
      <div className="card card-body mb-4">
          <label style={{fontSize:"1.5rem"}}>Other Settings</label>
          <div className="form-group">
              <label className="control-label" htmlFor="pluginName">Plugin Name</label>
              <input className="form-control" id="pluginName" name="topic" type="text" value={pluginConfig.name} onChange={e=>updateNames(e.target.value)} />
          </div>
      </div>
    </form>
    );
  }
}

export default App;
