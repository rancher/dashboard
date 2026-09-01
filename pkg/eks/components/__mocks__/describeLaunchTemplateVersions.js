export default {
  $metadata: {
    httpStatusCode:  200,
    requestId:       '24e9fe95-2356-4e5d-a704-9174a0474c0b',
    attempts:        1,
    totalRetryDelay: 0
  },
  LaunchTemplateVersions: [
    {
      LaunchTemplateId:   'lt-123123',
      LaunchTemplateName: 'test-template',
      VersionNumber:      4,
      VersionDescription: 'no tags',
      CreateTime:         '2024-03-01T23:51:30.000Z',
      CreatedBy:          'arn:aws:sts::testdata1234',
      DefaultVersion:     false,
      LaunchTemplateData: {
        IamInstanceProfile:  { Arn: 'arn:aws:iam::821532311898:instance-profile/ec2-full' },
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/sdb',
            Ebs:        { VolumeSize: 80 }
          }
        ],
        ImageId:         'ami-08f7912c15ca96832',
        InstanceType:    't2.large',
        MetadataOptions: {
          HttpTokens:              'required',
          HttpPutResponseHopLimit: 2,
          HttpEndpoint:            'enabled'
        }
      }
    }
  ]
};
