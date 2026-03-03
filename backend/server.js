require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
const app = require('./src/app');

// allow overriding the DNS servers used by Node's resolver in situations where
// the OS/network configuration is blocking SRV lookups.  you can set the
// environment variable `DNS_SERVERS` to a comma-separated list such as
// "8.8.8.8,1.1.1.1".  this is optional; if not provided the platform default
// settings are used.
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(','));
}

const PORT = process.env.PORT || 4000;

// prefer a non-SRV string when provided; may be useful if DNS SRV queries are
// failing (e.g. ECONNREFUSED from `querySrv` when using mongodb+srv URI).
const MONGO_URI =
  process.env.MONGO_URI_NOSRV ||
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/servsync';

// mongoose 6+ no longer requires the old connection options.  the driver
// v4 shipped with mongoose removed the `useNewUrlParser`/`useUnifiedTopology`
// flags entirely, which were previously needed on v3.
// we just pass the URI and rely on defaults.
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`ServSync API listening on ${PORT}`));
  })
  .catch((err) => {
    // if the error was caused by a DNS SRV lookup failure and we don't already
    // have a non-srv uri, we log instructions for how the user can supply one.
    if (
      err.code === 'ECONNREFUSED' &&
      err.syscall === 'querySrv' &&
      MONGO_URI.startsWith('mongodb+srv') &&
      !process.env.MONGO_URI_NOSRV
    ) {
      console.error(
        'MongoDB connection error - SRV lookup failed. ' +
          'You can either fix your DNS/firewall or set MONGO_URI_NOSRV to ' +
          'a standard mongodb:// connection string that includes the hosts ' +
          'returned by the SRV record (see README or Atlas connection screen).'
      );
    } else {
      console.error('MongoDB connection error', err);
    }
    process.exit(1);
  });



