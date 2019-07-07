import section, { SpecReporter } from 'section-tests';
import logd from 'logd';
import ConsoleTransport from 'logd-console-transport';

section.use(new SpecReporter());

logd.transport(new ConsoleTransport());