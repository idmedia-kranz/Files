#include <ArduinoJson.h>

int relays[] = {22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37};
String received;
int i;
  
// the setup function runs once when you press reset or power the board
void setup() {

  Serial.begin(115200);
  
  Serial.println("Prepare "+String(sizeof(relays)/2)+" relays.");
  for (i = 0; i < sizeof(relays)/2; i++){
    pinMode(relays[i], OUTPUT);
    digitalWrite(relays[i], HIGH);  
  }

  StaticJsonDocument<200> doc;

  doc["sensor"] = "gps";
  doc["time"] = 1351824120;
  JsonArray data = doc.createNestedArray("data");
  data.add(48.756080);
  data.add(2.302038);
  serializeJson(doc, Serial);
  Serial.println();
  serializeJsonPretty(doc, Serial);
}
bool beginn = true;
// the loop function runs over and over again forever
void loop() {
  /*
  if (Serial1.available() > 0)
  {
      received = Serial1.readStringUntil('\n');
      Serial.println("Befehl empfangen: "+received+" (länge "+String(received.length())+")");
      Serial1.println("Befehl empfangen: "+received+" (länge "+String(received.length())+")");
      if((char)received[0] == 'm'){
        int relay;
        int status;
        for (i = 1; i < received.length(); i+=3){
          relay = ((received[i]-'0')*10)+(received[i+1]-'0');
          status = received[i+2]-'0';
          Serial.println("Relay: "+String(relay));
          Serial.println("Status: "+String(status));
          digitalWrite(relays[relay-1], !status);  
        }
      }
  }
  */
  if(beginn){
  Serial.println("A");
delay(1000);
  }
  if (Serial.available() > 0)
  {
      
      received = Serial.readStringUntil('\n');
      if((char)received[0] == 'm'){
        int relay;
        int status;
        for (i = 1; i < received.length(); i+=3){
          relay = ((received[i]-'0')*10)+(received[i+1]-'0');
          status = received[i+2]-'0';
          if(status==0||status==1){
            Serial.println(received);
            beginn = false;
            digitalWrite(relays[relay-1], !status);  
            
            if(status){
                Serial.println("A");
            } else {
                Serial.println("B");
            }
          }
        }
      }
  }
}
