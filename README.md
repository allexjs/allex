# AllEx JS Runtime

This module brings the crucial program, the `allexmaster`

## allexmaster

This is the AllexJS Machine Manager. It does exactly what its name says - manages all the processes on your machine.

However, the mechanics for that management job is divided into several layers.

### Reading the conf

The configuraton file is written in JSON format in the `allexmasterconfig.json` file.

When `allexmaster` is started in a particular directory, it looks for `allexmasterconfig.json` in that directory. If such a file is not found, a default configuration is created.

```javascript
{
  "lanmanageraddress":"127.0.0.1",
  "portrangestart":{
    "tcp":15000,
    "http":16000,
    "ws":17000
  }
}
```

#### lanmanageraddress
This is the address where `allexmaster` will be looking for for the Lan Manager `allexlanmanager`, on the default port 23552, on the default protocol 'ws' (WebSockets). Support for different ports/protocols is about to come

#### portrangestart
`allexmaster` will be spawning new processes for various Services. Each new process will be told to start listening on 
- tcp
- http
- ws
protocols, and for each protocol a different port will be declared.

For each of the three protocols, `allexmaster` maintains a list of open ports (via [allex_portofficeserverruntimelib](https://github.com/allex-serverruntime-libs/portoffice)), so that each new process will be declared the first free port for the protocol - starting from a number defined in `allexmasterconfig.json`

#### Unix socket protocol
Unix sockets (or _pipes_) are sockets that work only within a single machine. In order for all spawned child processes to be capable of talking to `allexmaster`, and vice versa, Unix socket servers will be opened like this:
- `allexmaster` listens on `/tmp/allexmachinemanager` for U#ix based machines, or `\\\\x\\pipe\allexmachinemanager` on Windows based machines (taken care of by [allex_temppipedirserverruntimelib](https://github.com/allex-serverruntime-libs/temppipedir))
- a child process with pid, for example, 355 will be listening on `/tmp.allexprocess.355`

Because the "port" for Unix sockets is controlled by the OS kernel (that assigns process pids), there is no starting port number in `allexmasterconfig.json`.

### Satisfying the needs of LanManager
`allexmaster`
1. connects to `allexlanmanager` on the declared address, on the predefined port with the predefined `ws` protocol
2. reads the list of unsatisfied needs (list of Services that should be instantiated)
3. for each unsatisfied need spawns a new child process with ports assigned to protocols
4. notifies the `allexlanmanager` about the new process
5. lets `allexlanmanager` to check the declared ports if it can reach them
6. once `allexlanamanger` approves the listening ports, it will delete the satisfied need from a list of needs and put up a new record in the list of running Services so that the whole cloud can use it

### Reporting "Service down" events
Because `allexmaster` is directly connected to its child process (in a Parent-Child relationship), it is the first to know if the program stopped working. At that moment it notifies `allexlanmanager` about this event.

When notified, `allexlanmanager` will remove the corresponding record from the list of running Services and recreate the appropriate Service need record in the list of Services that should start.
