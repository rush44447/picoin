export const Connection = () => ({
  host: process.env.HOST || 'localhost',
  name: process.env.NAME || '1',
  port: process.env.PORT || '3001',
  logLevel: process.env.LOGLEVEL || 6,
  peers: (process.env.PEERS.slice(1,-1).length > 0 ? process.env.PEERS.slice(1,-1).replace(/'/g,"").split(',') : []).map((peer)=>{
    return { url: `http://${peer}`}
  })
})