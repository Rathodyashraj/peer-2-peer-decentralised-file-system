import { getIdentity, saveIdentity } from "./indexedDB.js";
import { generateIdentity } from "./generateIdentity.js";
import axios from "axios";

export const ensureIdentity = async(user) => {

    //check if indexed Db has deviceId and privatekey
    const identity = await getIdentity();

    let shouldGenerateDeviceId = false;

    if(!identity || !identity.deviceId || !identity.privateKey){
        shouldGenerateDeviceId = true;
    }
    else{
        const found = user.devices.some(device => device.deviceId === identity.deviceId)

        if(!found){
            shouldGenerateDeviceId = true;
        }
    }


    if(shouldGenerateDeviceId){

        const {deviceId, publicKey, privateKey} = await generateIdentity();
  
        const res = await axios.post('http://localhost:8000/registerDevice', {deviceId,publicKey},{withCredentials: true});

        await saveIdentity(deviceId,privateKey);

    }


}