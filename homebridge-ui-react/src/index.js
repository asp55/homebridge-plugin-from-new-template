/* eslint-disable no-undef */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

(async () => {
  // get the initial config - this is an array potentially containing multiple config blocks

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();



//	<script>
//	(async () => {
//	
//	
//	  // get the intial from the config and add it to the form
//	  if (!pluginConfig.length){
//	    pluginConfig.push({
//	      mqtt: {
//	        protocol: "mqtt",
//	        host: schema.schema.properties.mqtt.properties.host.default,
//	        port: schema.schema.properties.mqtt.properties.port.default,
//	        user: "",
//	        password: ""
//	      },
//	      rfbridge: {
//	        topic: "",
//	        protocol: schema.schema.properties.rfbridge.properties.protocol.default
//	      },
//	      remotes: []
//	    });
//	  }
//	
//	  //mqttProtocol mqttBroker mqttPort mqttUsername mqttPassword
//	  
//	  document.querySelector('#mqttProtocol').querySelectorAll("option").forEach(option=>{
//	    if(option.value === pluginConfig[0].mqtt.protocol) option.selected = true;
//	    else option.selected = false;
//	  })
//	
//	  document.querySelector('#mqttBroker').value = pluginConfig[0].mqtt.host;
//	  document.querySelector('#mqttPort').value = pluginConfig[0].mqtt.port;
//	  document.querySelector('#mqttUsername').value = pluginConfig[0].mqtt.user;
//	  document.querySelector('#mqttPassword').value = pluginConfig[0].mqtt.password;
//	
//	  //rfbridgeTopic rfbridgeProtocol
//	  document.querySelector('#rfbridgeTopic').value = pluginConfig[0].rfbridge.topic;
//	  document.querySelector('#rfbridgeProtocol').value = pluginConfig[0].rfbridge.protocol;
//	
//	  //remote0Name remote0ID
//	  pluginConfig[0].remotes.forEach((remote, remoteIndex)=>{
//	    const id = remote._id ? remote._id : (()=>{
//	      const _id = Date.now();
//	      pluginConfig[0].remotes[remoteIndex]._id = _id;
//	      homebridge.updatePluginConfig(pluginConfig);
//	      return _id;
//	    })();
//	    
//	    newRemote(id, remote.name, remote.remote_id);
//	  })
//	
//	  // watch for changes to the form and update the config
//	  document.getElementById('configForm').addEventListener('input', () => {
//	      // get the current values from the form
//	      
//	      //mqttBroker mqttPort mqttUsername mqttPassword
//	      pluginConfig[0].mqtt.protocol = document.querySelector('#mqttProtocol').value;
//	      pluginConfig[0].mqtt.host = document.querySelector('#mqttBroker').value;
//	      pluginConfig[0].mqtt.port = document.querySelector('#mqttPort').value;
//	      pluginConfig[0].mqtt.user = document.querySelector('#mqttUsername').value;
//	      pluginConfig[0].mqtt.password = document.querySelector('#mqttPassword').value;
//	
//	      //rfbridgeTopic rfbridgeProtocol
//	      pluginConfig[0].rfbridge.topic = document.querySelector('#rfbridgeTopic').value;
//	      pluginConfig[0].rfbridge.protocol = document.querySelector('#rfbridgeProtocol').value;
//	
//	      for(let remoteIndex = 0; remoteIndex < pluginConfig[0].remotes.length; remoteIndex++) {
//	        const key = pluginConfig[0].remotes[remoteIndex]._id;
//	        pluginConfig[0].remotes[remoteIndex].name = document.querySelector(`#remoteName${key}`).value;
//	        pluginConfig[0].remotes[remoteIndex].remote_id = document.querySelector(`#remoteID${key}`).value;
//	      }
//	
//	      // update the config
//	      homebridge.updatePluginConfig(pluginConfig);
//	      console.log(JSON.stringify(pluginConfig,null,2));
//	  });
//	
//	  document.querySelector('#addRemote').addEventListener('click', ()=>{
//	    newRemote(pluginConfig[0].remotes.length);
//	    pluginConfig[0].remotes.push({name:"", remote_id:"", id:Date.now()});
//	    homebridge.updatePluginConfig(pluginConfig);
//	  });
//	
//	  /*
//	  // watch for click events on the getTokenButton
//	  document.querySelector('#getTokenButton').addEventListener('click', async () => {
//	      // validate a username was provided
//	      const username = document.querySelector('#userNameInput').value;
//	
//	      if (!username) {
//	          // create a error / red toast notification if the required input is not provided.
//	          homebridge.toast.error('A username must be provided.', 'Error');
//	          return;
//	      }
//	
//	      // starting the request, show the loading spinner
//	      homebridge.showSpinner();
//	
//	      // request a token from the server
//	      try {
//	          const response = await homebridge.request('/token', {
//	              username: username,
//	          });
//	
//	          // update the token input with the response
//	          document.querySelector('#tokenInput').value = response.token;
//	
//	          // update the plugin config
//	          pluginConfig[0].token = response.token;
//	          homebridge.updatePluginConfig(pluginConfig);
//	
//	          // show a success toast notification
//	          homebridge.toast.success('Got Token!', 'Success');
//	      } catch (e) {
//	          homebridge.toast.error(e.error, e.message);
//	      } finally {
//	          // remember to un-hide the spinner
//	          homebridge.hideSpinner();
//	      }
//	  });
//	  */
//	})();
//	</script>