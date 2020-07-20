//
//  Created by Mingliang Chen on 17/8/1.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//

const Https = require('https');
const Logger = require('./node_core_logger');
const NodeRtmpServer = require('./node_rtmp_server');
const NodeHttpServer = require('./node_http_server');
const NodeTransServer = require('./node_trans_server');
const NodeRelayServer = require('./node_relay_server');
const NodeFissionServer = require('./node_fission_server');
const context = require('./node_core_ctx');
const Package = require("./package.json");

class NodeMediaServer {
  constructor(config) {
    this.config = config;

    if (this.config.rtmp) {
      this.nrs = this.config.rtmp.factory && typeof this.config.rtmp.factory === 'function'? this.config.rtmp.factory(context, this.config, Logger, NodeRtmpServer) : new NodeRtmpServer(this.config);
    }

    if (this.config.http) {
      this.nhs = this.config.http.factory && typeof this.config.http.factory === 'function'? this.config.http.factory(context, this.config, Logger, NodeHttpServer) : new NodeHttpServer(this.config);
    }

    if (this.config.trans) {
      if (this.config.cluster) {
        Logger.log('NodeTransServer does not work in cluster mode');
      } else {
        this.nts = this.config.trans.factory && typeof this.config.trans.factory === 'function'? this.config.trans.factory(context, this.config, Logger, NodeTransServer) : new NodeTransServer(this.config);
      }
    }

    if (this.config.relay) {
      if (this.config.cluster) {
        Logger.log('NodeRelayServer does not work in cluster mode');
      } else {
        this.nls = this.config.relay.factory && typeof this.config.relay.factory === 'function'? this.config.relay.factory(context, this.config, Logger, NodeRelayServer) : new NodeRelayServer(this.config);
      }
    }

    if (this.config.fission) {
      if (this.config.cluster) {
        Logger.log('NodeFissionServer does not work in cluster mode');
      } else {
        this.nfs = this.config.fission.factory && typeof this.config.fission.factory === 'function'? this.config.fission.factory(context, this.config, Logger, NodeFissionServer) : new NodeFissionServer(this.config);
      }
    }
  }

  run() {
    Logger.setLogType(this.config.logType);
    Logger.log(`Node Media Server v${Package.version}`);
    if (this.nrs) {
      this.nrs.run();
    }
    if (this.nhs) {
      this.nhs.run();
    }
    if (this.nts) {
      this.nts.run();
    }
    if (this.nls) {
      this.nls.run();
    }
    if (this.nfs) {
      this.nfs.run();
    }

    process.on('uncaughtException', function (err) {
      Logger.error('uncaughtException', err);
    });

    Https.get("https://registry.npmjs.org/node-media-server", function (res) {
      let size = 0;
      let chunks = [];
      res.on('data', function (chunk) {
        size += chunk.length;
        chunks.push(chunk);
      });
      res.on('end', function () {
        let data = Buffer.concat(chunks, size);
        let jsonData = JSON.parse(data.toString());
        let latestVersion = jsonData['dist-tags']['latest'];
        let latestVersionNum = latestVersion.split('.')[0] << 16 | latestVersion.split('.')[1] << 8 | latestVersion.split('.')[2] & 0xff;
        let thisVersionNum = Package.version.split('.')[0] << 16 | Package.version.split('.')[1] << 8 | Package.version.split('.')[2] & 0xff
        if (thisVersionNum < latestVersionNum) {
          Logger.log(`There is a new version ${latestVersion} that can be updated`);
        }
      });
    }).on('error', function (e) {
    });
  }

  on(eventName, listener) {
    context.nodeEvent.on(eventName, listener);
  }

  stop() {
    if (this.nrs) {
      this.nrs.stop();
    }
    if (this.nhs) {
      this.nhs.stop();
    }
    if (this.nts) {
      this.nts.stop();
    }
    if (this.nls) {
      this.nls.stop();
    }
    if (this.nfs) {
      this.nfs.stop();
    }
  }

  getSession(id) {
    return context.sessions.get(id);
  }
}

module.exports = NodeMediaServer