# Browsers tested #

Mar. 18, 2021

[Check script on the demo page](https://goto920.github.io/demos/simple-mixer/check-audioworklet.html)

## Ubuntu 20.04LTS ##

### Firefox ###

```
Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:86.0) Gecko/20100101 Firefox/86.0
{"isAudioContext":true,"isOfflineAudioContext":true,"isAudioWorkletNode":true,
"isAudioWorklet":true,"isOfflineAudioWorklet":true,"isAddModule":true,
"isOfflineAddModule":true}

(summary) isAudioWorkletAvailable:  online=true, offline=true
```

### Chrome ###
```
Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36
{"isAudioContext":true,"isOfflineAudioContext":true,"isAudioWorkletNode":true,
"isAudioWorklet":true,"isOfflineAudioWorklet":true,"isAddModule":true,
"isOfflineAddModule":true}

(summary) isAudioWorkletAvailable:  online=true, offline=true
```

## Windows 10 (20H2) ##

### Edge ###
- Looks identical to Chrome except for the last Edg/89.0.774.54

```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.54
{"isAudioContext":true,"isOfflineAudioContext":true,"isAudioWorkletNode":true,
"isAudioWorklet":true,"isOfflineAudioWorklet":true,"isAddModule":true,
"isOfflineAddModule":true}

(summary) isAudioWorkletAvailable:  online=true, offline=true
```

### Chrome ###

```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36
{"isAudioContext":true,"isOfflineAudioContext":true,"isAudioWorkletNode":true,
"isAudioWorklet":true,"isOfflineAudioWorklet":true,"isAddModule":true,
"isOfflineAddModule":true}

(summary) isAudioWorkletAvailable:  online=true, offline=true
```

## macOS (Apple Silicon) ###

### Safari ###

- Brower is for Intel CPU

```
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15
{"isAudioContext":true,"isOfflineAudioContext":true,"isAudioWorkletNode":false,
"isAudioWorklet":false,"isOfflineAudioWorklet":false,"isAddModule":false,
"isOfflineAddModule":false}
```

### Chrome ###

```
Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36
{"isAudioContext":true,"isOfflineAudioContext":true,"isAudioWorkletNode":true,
"isAudioWorklet":true,"isOfflineAudioWorklet":true,
"isAddModule":true,"isOfflineAddModule":true}

(summary) isAudioWorkletAvailable:  online=true, offline=true
```

## Android 7.0 (Sony SO-02H) ###

### Chrome ###

```
Mozilla/5.0 (Linux; Android 7.0; SO-02H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36
{"isAudioContext":true,"isOfflineAudioContext":true,"isAudioWorkletNode":true,
"isAudioWorklet":true,"isOfflineAudioWorklet":true,"isAddModule":true,
"isOfflineAddModule":true}

(summary) isAudioWorkletAvailable:  online=true, offline=true
```

## iOS 12.5.1 (iPhone 6)###

### mobile Safari ###
```
Mozilla/5.0 (iPhone; CPU iPhone OS 12_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1 
{"isAudioContext":true,"isOfflineAudioContext":true,"isAudioWorkletNode":false,
"isAudioWorklet":false,"isOfflineAudioWorklet":false,"isAddModule":false,
"isOfflineAddModule":false} 

(summary) isAudioWorkletAvailable: online=false, offline=false
```

### mobile Chrome ###

- Looks identical to mobile Safari

```
Mozilla/5.0 (iPhone; CPU iPhone OS 12_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1 
{"isAudioContext":true,"isOfflineAudioContext":true,"isAudioWorkletNode":false,
"isAudioWorklet":false,"isOfflineAudioWorklet":false,"isAddModule":false,
"isOfflineAddModule":false} 

(summary) isAudioWorkletAvailable: online=false, offline=false
```
