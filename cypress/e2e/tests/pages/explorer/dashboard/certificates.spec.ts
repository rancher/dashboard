
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { SecretsPagePo } from '@/cypress/e2e/po/pages/explorer/secrets.po';
import { CYPRESS_SAFE_RESOURCE_REVISION } from '@/cypress/e2e/blueprints/blueprint.utils';

const certName = 'expired';
const certNs = 'defaut';
const expiredCert = {
  id:    `default/${ certName }`,
  type:  'secret',
  links: {
    remove: `https://localhost:8005/v1/secrets/${ certNs }/${ certName }`,
    self:   `https://localhost:8005/v1/secrets/${ certNs }/${ certName }`,
    update: `https://localhost:8005/v1/secrets/${ certNs }/${ certName }`,
    view:   `https://localhost:8005/api/v1/namespaces/${ certNs }/secrets/${ certName }`,
  },
  _type:      'kubernetes.io/tls',
  apiVersion: 'v1',
  data:       {
    'tls.crt': 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUZhekNDQTFPZ0F3SUJBZ0lVSXpkVkZPYmo2YW80RVdpR2dmcjY1RThzSVl3d0RRWUpLb1pJaHZjTkFRRUwKQlFBd1JURUxNQWtHQTFVRUJoTUNRVlV4RXpBUkJnTlZCQWdNQ2xOdmJXVXRVM1JoZEdVeElUQWZCZ05WQkFvTQpHRWx1ZEdWeWJtVjBJRmRwWkdkcGRITWdVSFI1SUV4MFpEQWVGdzB5TkRBMU1ETXhOVEkwTlRkYUZ3MHlOREExCk1EUXhOVEkwTlRkYU1FVXhDekFKQmdOVkJBWVRBa0ZWTVJNd0VRWURWUVFJREFwVGIyMWxMVk4wWVhSbE1TRXcKSHdZRFZRUUtEQmhKYm5SbGNtNWxkQ0JYYVdSbmFYUnpJRkIwZVNCTWRHUXdnZ0lpTUEwR0NTcUdTSWIzRFFFQgpBUVVBQTRJQ0R3QXdnZ0lLQW9JQ0FRQ3hmUllFUGNZTUg3dWVXdUMxTEpscTA4aFBsNEd0S2xGTzladkVrODhoCmlKdkZkTk1PSXRObnNXQUFBOER5a1ZXRG5pbEZpRmhhQ1BsVjhJRFV1ZVV4ZnM2S2FiZjNmUjQ3dXkzTXI4SU8KSW5pdWtzbWRmdjc5YmE3VE82eVduVld0WXhHd2F5R29DbXY0MjA0Kzh5NkVBd2djOG5TcGhmdSsrYjlCeEpMUwpaVzZiTVFma2I4czBQRFhUUmpHdGxFT0ZNVkZGS2V2djgzNndaK1FhbXBJbS9vVWdoTFowRVVBODlnTnhncHc2CjNoS1dGVzEwVzJ1ZVN1WUJGaEVycDJkYktQanhiRG1CUlg5UklHQVVSbUlTYlNNQjlmWVVMa2o5TU5OOG5GQWEKVkY0WWx0dVhacnR4d0dTL1lUSEE5UUdIWFdQSll5WDN6cWFoektpdGlqakhPUDBXNU1OTDZ3QmV4Nm15L3p1ZAo5ckw4cnNOS3U5ejh6clZqNFdUWjJNWUsyWXlRYitvTElxMlFLMXQvY0krVDZKTy85cTFhYkV0N1NtTGtWVVpnClA1UTgvNU5YQzlTSXNWMTFEVUNVWE1hSlViZmN6OHBlbTE4cjFraUYxSTJ0MmkvRldxT3VEd1VScTRUSHVXSWYKTkh0a0N0dEltVGRsRGRhaXN2dVFuNGhXQUplbjlDNGJNWFRtczBWcVBpWFlFZENMbFhhRXYwYWJ0d2RWU3o1cgp5K1h5M3htaEt4YWxNNnFLWWU2bUhNRjBxQjdId3BMb2xEY0oyOUR0NW05WWtKYkFleHBnQW8zMm4vUjh3dFg5CmhHNWRpOWVYd1piNDNOU3JQeHpacDd1UG1tbm95dnBZOWhQWit0MDM3cmg4QXhMVy9NRVEyR21jOGRtMStpODUKL3dJREFRQUJvMU13VVRBZEJnTlZIUTRFRmdRVStxV0pXM3NwOHB2cVdXRXB5UUZoSWprUTJtc3dId1lEVlIwagpCQmd3Rm9BVStxV0pXM3NwOHB2cVdXRXB5UUZoSWprUTJtc3dEd1lEVlIwVEFRSC9CQVV3QXdFQi96QU5CZ2txCmhraUc5dzBCQVFzRkFBT0NBZ0VBZmhIZXoyc1NrbFYxQW1ZNnZEVGhZRUtXMUNUa2NvUlVqZitKeVo5dXFkRDkKOXdqV25VK2YwbndScEV6OEhqQjd6ckVvWUNtNkdDd280QTNjVXhuVTJXRDFaZkhId3JxemxOekFXcktDa3NtWQpnRHBDQ0d4QVdTaThydWxUak81M0czZGI1MmZ3Y0RzWDFDUWU1QjdhZEFLdnRrb3BXelFaaUtFRE1ZUm1HTE5rCjJEUDIrSExHRFhnZHBjaTloajc1eGtXaUFteXEyWGNqZHpuUHBKa3lLQjNjdXFhVDc2R2h6Ym5CakVjOXU1cTYKZnlwZEZvVzlwWFJxcUVvcWlYR1phNWRaemFBUEtEVytSUDhJcDQzYVVKRFBMU0tyanYvdnkvNDdVaTcraEtueAp4dkFPMFMxTlNpUTBiMFFGTmxiSytaVnA2Q2p6QXNmVm8wSUF1RHZuVnJOUWMxWVNCenhwYUlzZkNkVkFUdG9KCkNJTi84azJkV29XZTU1U1FHZ0Y0Z09OTDlOYzQ2MWxURWdtY2tZREk3bTFXazNjdVBHTnJXUS9HVWZIRGNFTE8KMmw3WmFRUVlkbC9DU1Njd2JTMFkyaUhScHBiZVNHcHVnRFBWckxsNjZKUnU5SlUyUzh2TUZJZHBEd2NqamF1RgpqQWliSFBqWEs1MGI1UjNhOFlBMW84Z2JIcG90b0d3dmNEUlRCWnlSVGtjUWN4QjlPZkdFS0hadFhNVTlaWGdyCkdWZnlzekNNUTlMYVZjZFJXaitoR3c2WjVod1l6bW5KYXUrK1Q3enhuY2d4UC9iaE1yRGxQd2NTWmpmZnFQcjEKU3ArVVJDYzA3Ulc4VnhhOUhRQU00RmZldlk2ZElkVi9mTDhMYUNaVE15WlRGVXAxVnhPdXkrdWNGTXp5YUxjPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0t',
    'tls.key': 'LS0tLS1CRUdJTiBFTkNSWVBURUQgUFJJVkFURSBLRVktLS0tLQpNSUlKbkRCT0Jna3Foa2lHOXcwQkJRMHdRVEFwQmdrcWhraUc5dzBCQlF3d0hBUUk0NEVWZ2dDTmN2RUNBZ2dBCk1Bd0dDQ3FHU0liM0RRSUpCUUF3RkFZSUtvWklodmNOQXdjRUNJR0thdnAxSWZCVkJJSUpTRFdjM2dnVTVoZVoKdVQ1WGtnTFZDNTZ3WU5URmFPWHFaOFI3NWs2RjgxSDd6L3F1MW45TXdzYWpwK1VXcnBiRFg2d1pQOWRaVlBVUgo3VUNKeExZdm9LaWNZb2FqeDhkVGFaRCtXb3MzYVFkWlFUSTlVcjRhWUwxVDdFWmQydWhQOFBjeUxvWjdlWi9FCktQNFRENUkwVzBzNFZiVGhzYzBscVQzb1B5NEpkNmlsOFRGWm9DaWhaOEhqTHJicXBrY3ZpbklseTFFeGNKTHEKWWloZVdTQTFoTGtTYzlVY0t4V2VpMVZHZW9jVzNrbVAvSlFDendGZDJmSUp3NGxWbGo5cXY4WUNSaDFXYjJkYgp1MTc5UzI0RHQ1TVpLNU8wQmxJYWJkVTIySk0rVnoxU1V5c2Z0UWlzVzVXeHEwaDIzbWhUYW5paGE0dkVabXlXCkwwSU1NdjlIU2RMYnpSUk9hbW5Va01Dcmc0RG0yTnBuSGxneE1wLytPU3k4Sm0vUHhLVGhnL2ErbFZSdUNiMFkKQWorSUxBbU9YbC9ERHFtK2FuZVEzNTJwazNhOGF1MU5DM0E0UjU3QTZ4Q2tGMVlVZnF1ZUVlU3AwMHBDTEJsNQpPTTdYVlBrakEzYmlxNExzWHNDMjJtYzh4S1VrcmVBVUFvRVVpVHc4T3M0T1V2MTIyMWtsSEZwWmVnUFovckx3CkQ2Y0o1NDlFNDFyeE1pOENEd2hzZGFZV2s1Qkp1Sm52b0c1ZEtYMGlicWxZS05vTVBNcVNqS2Y0TnZybStZOVoKS0dBSlB4bysrcWZPVG9VV3IwMktMajZpMG5GYUdOL1FUVUp2aGd6SUVqZmQ4em81MWtwTUYwVTRmRWlIM2oxVQpDejFiVWhKbVkzaDYrYldqclJhQ3o2N3lkdDhqYXpiaEg5TlF6Y3U1TlFhWUw1VWpCVSszaVRsUUYxcXZwaWJTCmMwLzI5RzBCdm8rK2dqYUczM0tnUllQVDdESG1SbHMzb1lZWW5DazVCajd6MVNIWGNCVVNXWDVFN2RoWmdpblAKYkVlcEhrVm44bWFuSEpBZExBZEJOT3RaNEg2N1Fla1l4cEdVVUNMN0FISGhnZ3ZaQVFkT1pNdWNFU1krdGdlWApSTUI5N0pKQnJoU1lHckthaXpHSHRCcnBXRFlFWEZpTDVuR3JOWktaNUFNcnVxNjdzRk13cXBWOENNdW41L3pNCk1VbmpFT1ZXQUlTQmFxRlphc2FZS1ZnRFp4cFVtS2RmS0dRaUJJSmFLTWJqdUpQQ0ZXaDZURHhwcllGUDVEYkMKbWM1ejQvRk02UStXVlIxSmxJVVRuelRPNEovK2pYazNnTFJ1dW1oN3k4Yk5Ba3JYNWdTRkUydUdENG0zeWxhNQpOZDNnS2JBeU5MdDArMVBTSEVTNmNnMHF5SXRISHlrR0xxT25oTVhlWGh5ZklvNWcyNVIxTVpwYmllRGpVM0UzCkpONXpUNDhENlplYXBKRHpTUlFFdGt1NThjaHNGZFhRY2hqbGZJRWIwQnF0b01XOWpKcFpvN2tha2RtRFM5NkIKdmFaZjUrWUNBYTRUV0c4ZHhaM3I3N0hwOXprY2R2SmlJODkvOTJnSDlLblFadm45WlJTQW1VQVdVeUpQY0d3RwpDejJ1SmVWQTlBcDdsdFBXeWkvQkdhL3N2WlYyVEtiL0JrTi8wN0dSUS9uM3Z6cVgvanFxVFVsVFN1QWl0NzI1CmtZZFNxaklEdExhTGRkTUh2S3hIcGg0YTJNNUNTRzhQY1lHVVRXNmNmMUNEdWFUWm16V2YwS2JIbFNjWmVOYlQKRWRxbmE2WnNhTTZUVUtSdUNsdW1hMkMyd1Z5a2Nab3IzeGtKNFhETmwweXhDUUY0anRSR0J0WXlJYUVGbVhpYQovRTdYbFN6SHRUVnltQVdsbnpRMGx0U3o1aDNJL09LUnZzUFI1RnZCOW9vd1BjV3ZERm8zMzVqSWNJMlA0WG1RCmtHSysvU0JTUWRFa0xTc2N1MjRKYStMbjAxUjR1UklOT2VGeHAvVnFHZzQxWmVMdTd1WFlhUVNPaU1admQybTYKMEdXL05PdXBWUXNzWk9zbTllY2VHVDZmeXlya29YS3VFdXFCdWgyTHJsaVRmeW5iRUp4WU40N1JHVmJxTE9ILwpDR1BuNnY2LytmUjBKOGNCd0lNT1BPQXNjUWI4Y24zUitTeUJCMXFUVHBKYk8yWnkvc0VCTG42d2FiOGE5aU0rCjQ2cG5vVmpVSlBTTUZDamY5cjlUbHl6a2taODNEZ0hqSTJkOXV6UlhISlpvdkRhRjdJc3JQUTBtYy8xN2dRbWcKL1pVTTdBc0RWcU9iQ2hIdms0NS9DRk95VE5VWVBmOVlqdlNOd1hLMVpROVR1Skl1bHYzb3N6UisyaGplaDJobwpIK2VmUWVWM1JVTXlKUWt1a3F1WjR2dDZTdkpjZysxVzgyQW4rSE9RNE5pQWsybEdjaThpYUE0SGx1Yi9TUlVFCmtaK0U0YmZ3WlNpMk9kbG1ZandHZmFnK2lyWGdJeWJxSkFJb2hobkVkNEp6MVJLb2t4bjk5RUYzNFN1Zk90Y0oKRmpIcEpKajNwMnRjSkFnUFRDQm0yejJkU2dITWs1VHFQSng1R3JUZ0xGQkd2RGk3UUg4cFNnc0hlczZETXFtLwp5WDBXa1dPZk9uVkRqUTIwS25sQm5SWmFyMThVZlh5SmZnVHA0RFdBQ2VZRDcxRERsOXZWaEFEVUNtVG1rRm40Cit3cHZ2TmNLVlVuVEVpY2NxV0c4bEFYVzR5amozMmZPaEhCWlNaNXErMW1GR0dPT1RpWVh4bU90UEhkenE5c1oKVEJXalRmNm9XNGN4bE5uWW1FWjYrcUhIVlBJY3lUenAwcnplejY3dmhiNVVLMGFSNzFVenJrdW5OQXBRTXlHYQpBVkU0VS9ISnZiaHVHb0s4czgzdEpBaGFqTzZVQTlNc296Y1NPdFY0NFNzTEV0YjBQRmtMMHFkVUxvamJjQlk2ClhyVVZRRlYydVFKZjhydEpWWkdFYllOZUt3cFlCVU5vTWJJaVhlaVBNbFZlMXROOFNLOEVyQnFrUUdwNFJid1MKWG8vdGxPbldZSWM3b0VRN0Y5SC90RldTQTFUUTVLb3Rtc1BKNWtLNDFlYzlGYjdYOGxmcklsczFEeUlaa1JoYgpGbmhZaW83QmJMb2p6YURqTXJCUGdOZUg4RE1JMTM5NUJuL2hLYlZ2OUVhcXpJK3FQeEhJblc5VDBQcCtHVHZTCi9LVmJBdDBjRXZCWklrZ3ZtNHR0RkYvcXBkOUtuSmZsdTdmWFJuUk8yTTN1Wm8yYmpZVHlXUW5RL2YzcTBEdDUKVENVQjZwSHRUTUc3NVFESTFPWjhrRjNpc01qamdaMEptS2NxMktEdXJvSXkzL2RNcTlKd2JZOURKcWhZZWlYOQo2bk9oWTg5VFV6MnlBOE8zdTluMHNEWHQwMTF1TFdCMWk3d0prVWJUZ3VPd2lRcUFjYUhySEFFK3BqWDlUU2JmCmdDWGpzOGRWVE8wOGtwT0l3QjVqUXM0RTdYdzJJSkNRODR0MVV0SzcwT1dEUWpuaEZPa29CMVJwbjVmVFVvTVoKZUxyY290Z2xKVWtRTi9PK3Z5RjBucjdzVUZvaG83dXBNNi9GYU1NR3krU1BaM3QvaE5rdjhPODRwcTRzUWtwbwpjRHFyYStFZllUU2xiTG52dnA0ZkRhQ3kxWGRPcDMwQ05qQmJCMGtUeUE5cll5c0xKVkhXbzRpbUk2L2JFYWljCjZTRmdSV0E2KzVMMzhVQzd0TmNFdSt5MjUxOVpFQnJ0VU92UExteG5HN1dOdnQ5czFyNWZFcXNuRDFUSHFQNjIKQXNaODZ3ekdjdElvOHQ5TXVIcW91Qm5hb0JRVHZqbTdSNEJvSjZZR21PaDF0Z1c1cm8wT2djUlBZOHBVaEtyQQplTm42YW0vajA0SlFQa0xpUEVWaVR5VklLZVUzdFhOZmhFRWJFUVB2NWlLM24vR1p1TkxhUElFQzYzU0FkYkkrCnJvSUw0TXJZOWIzOXpEbUVBdnJlN3VuUVM0VjZDZnFOL21MZU9ObC80YUxkZWZ1T2pTN09Dd0xQWUFUeXQ5ODkKdndtWjhDcDhWYkZvNHdtak4vZUErN3RTZHFNSTZYVlloMG04REJtWXJHdnVjeXdHdE9DaTltQnNaSmlyeFlFUQpIdGVKb1h0SVdWeDhkZFhLbUl1OC9RPT0KLS0tLS1FTkQgRU5DUllQVEVEIFBSSVZBVEUgS0VZLS0tLS0='
  },
  kind:     'Secret',
  metadata: {
    creationTimestamp: '2024-05-03T15:25:49Z',
    fields:            [
      certName,
      'kubernetes.io/tls',
      2,
      '11s'
    ],
    name:            certName,
    namespace:       certNs,
    relationships:   null,
    resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
    state:           {
      error:         false,
      message:       'Resource is always ready',
      name:          'active',
      transitioning: false
    },
    uid: '4783a9f0-53c6-43c0-afac-240047e4c6ea'
  }
};

describe('Certificates', { testIsolation: 'off', tags: ['@explorer', '@adminUser', '@standardUser'] }, () => {
  const clusterDashboard = new ClusterDashboardPagePo('local');

  before(() => {
    cy.login();
  });

  it('can navigate to certificates list', () => {
    ClusterDashboardPagePo.goTo('local');
    clusterDashboard.waitForPage();

    clusterDashboard.clickCertificatesTab();
    const certPo = clusterDashboard.certificates();

    certPo.checkVisible();

    certPo.list().resourceTable().sortableTable().rowElements()
      .should('have.length.gte', 2);
  });

  it("show correct 'expired' states", () => {
    cy.intercept('GET', '/v1/secrets?filter=metadata.fields.1=kubernetes.io/tls&exclude=metadata.managedFields', (req) => {
      req.reply((res) => {
        res.body.data.push(expiredCert);
        res.body.count += 1;
      });
    });

    ClusterDashboardPagePo.goTo('local');
    clusterDashboard.waitForPage();

    clusterDashboard.clickCertificatesTab();
    const certPo = clusterDashboard.certificates();

    certPo.checkVisible();

    const expiredBanned = certPo.expiredBanner();

    expiredBanned.checkVisible();
    expiredBanned.self().invoke('text').should('eq', ' 1 Certificate has expired ');

    const certRow = certPo.list().resourceTable().sortableTable().rowWithName(certName);

    certRow.self().scrollIntoView();
    certRow.checkVisible();
    certRow.column(1).invoke('text').then((el) => {
      expect(el.trim()).eq('Expired');
    });
  });

  // it("show correct 'expiring' states", () => {
  //   requires on the fly generation of certificate that will expiring within x of current time
  // });

  it('validate link to full secrets list', () => {
    clusterDashboard.waitForPage();
    clusterDashboard.fullSecretsList().scrollIntoView();
    clusterDashboard.fullSecretsList().click();

    const secrets = new SecretsPagePo('local');

    secrets.waitForPage();
  });
});
