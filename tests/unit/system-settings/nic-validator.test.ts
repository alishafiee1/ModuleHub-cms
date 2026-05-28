import {
  parseNetworkInterfaceList,
  validatePackageInstallInterface,
} from '../../../core/src/modules/system-settings/nic-validator';

describe('system-settings nic-validator', () => {
  it('parses interface names from ip -o link show up output', () => {
    const sample = `
2: enp63s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
3: wlp0s20f3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP mode DORMANT group default qlen 1000
    `.trim();

    expect(parseNetworkInterfaceList(sample)).toEqual(['enp63s0', 'wlp0s20f3']);
  });

  it('allows any interface when fewer than two NICs are reported', () => {
    expect(validatePackageInstallInterface('eth999', ['lo'])).toBeNull();
    expect(validatePackageInstallInterface('eth999', [])).toBeNull();
  });

  it('rejects unknown interface when two or more NICs exist', () => {
    const error = validatePackageInstallInterface('eth999', ['enp63s0', 'wlp0s20f3']);
    expect(error).toMatch(/not available/);
  });

  it('accepts interface present in available list', () => {
    expect(validatePackageInstallInterface('enp63s0', ['enp63s0', 'wlp0s20f3'])).toBeNull();
  });
});
