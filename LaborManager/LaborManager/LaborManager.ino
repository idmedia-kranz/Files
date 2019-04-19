#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <WebSocketsServer.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <Hash.h>

#include "FS.h"

ESP8266WiFiMulti WiFiMulti;

#ifndef STASSID
#define STASSID "HUAWEI-B525-388A"
#define STAPSK  "internet8272"
#endif

const char* ssid     = STASSID;
const char* password = STAPSK;
String received;
ESP8266WebServer server = ESP8266WebServer(80);
WebSocketsServer webSocket = WebSocketsServer(81);

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t lenght) {

    switch(type) {
        case WStype_DISCONNECTED:
            Serial.printf("[%u] Disconnected!\n", num);
            break;
        case WStype_CONNECTED: {
            IPAddress ip = webSocket.remoteIP(num);
            Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);

            // send message to client
            webSocket.sendTXT(num, "Connected");
        }
            break;
        case WStype_TEXT:
            String request = String((char*) payload);
            Serial.println(request);
            webSocket.sendTXT(num, "0");
            delay(1000);
            webSocket.sendTXT(num, "10");
            delay(1000);
            webSocket.sendTXT(num, "20");
            delay(1000);
            webSocket.sendTXT(num, "30");
            delay(1000);
            webSocket.sendTXT(num, "40");
            delay(1000);
            webSocket.sendTXT(num, "50");
            delay(1000);
            webSocket.sendTXT(num, "60");
            delay(1000);
            webSocket.sendTXT(num, "70");
            delay(1000);
            webSocket.sendTXT(num, "80");
            delay(1000);
            webSocket.sendTXT(num, "90");
            delay(1000);
            webSocket.sendTXT(num, "101");
            break;
    }

}

String loadFile(String filename){
  File file = SPIFFS.open("/"+filename, "r");
  if (!file) {
    Serial.println("file "+filename+" open failed");  
  } else{
    Serial.println("file "+filename+" open success");
    String html = "";
    while (file.available()) {
      String line = file.readStringUntil('\n');
      html += line + "\n";
    }
    file.close();

    return html;
  }
}

void setup() {
pinMode(2, OUTPUT); 
    Serial.begin(115200);
    
    //Serial.setDebugOutput(true);
    
    Serial.println();
    Serial.println();
    Serial.println();
/*
    for(uint8_t t = 4; t > 0; t--) {
        Serial.printf("[SETUP] BOOT WAIT %d...\n", t);
        Serial.flush();
        delay(1000);
    }
    */

    Serial.println("Prepare file system");
    SPIFFS.begin();

    /*
    WiFi.softAP("TCM2782758385", "12345678");
        
    IPAddress myIP = WiFi.softAPIP();
    Serial.print("AP IP address: ");
    Serial.println(myIP);
    */
    
    // connect to wlan
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);  //Verbinden mit Wlan Router
    Serial.println("Verbindung zum WLAN wird aufgebaut:");
    Serial.println(ssid);
    while(WiFi.status() != WL_CONNECTED) {
      Serial.print(".");
      delay(500);
    }
    Serial.println(WiFi.status() != WL_CONNECTED ? "=> Fail!":" => Connected!");
    Serial.println("IP adresse: ");
    Serial.println(WiFi.localIP());
    
    // start webSocket server
    webSocket.begin();
    webSocket.onEvent(webSocketEvent);

    if (MDNS.begin("esp8266", WiFi.localIP())) {
      Serial.println("MDNS responder started");
    }
  
    // handle index
    server.on("/", []() {
        server.send(200, "text/html", loadFile("index.html"));
    });
    
    server.on("/style.css", []() {
        server.send(200, "text/css", loadFile("style.css"));
    });
        
    server.on("/javascript.js", []() {
        server.send(200, "text/javascript", loadFile("javascript.js"));
    });

    server.on("/angular-dragdrop.js", []() {
        server.send(200, "text/javascript", loadFile("angular-dragdrop.js"));
    });
    server.begin();

    // Add service to MDNS
    MDNS.addService("http", "tcp", 80);
    MDNS.addService("ws", "tcp", 81);

    Serial.printf("Server Start\n");
}

void loop() {
    webSocket.loop();
    server.handleClient();
    
    if (Serial.available() > 0)
    {
        received = Serial.readStringUntil('\n');
        if((char)received[0] == 'A'){
          digitalWrite(2, LOW);   // Turn the LED on by making the voltage LOW
          Serial.println("m010");
        }
        if((char)received[0] == 'B'){
          digitalWrite(2, HIGH);   // Turn the LED on by making the voltage LOW
          Serial.println("m011");
        }
    }
}
