/* eslint-disable jest/no-hooks */
import FileSelector from '@shell/components/form/FileSelector';
import { mount } from '@vue/test-utils';

describe('component: FileSelector', () => {
  let wrapper: any;

  beforeEach(() => {
    jest.restoreAllMocks();
  });
  afterEach(() => {
    wrapper.unmount();
  });

  const binaryString = Buffer.from('/9j/4AAQSkZJRgABAQAASABIAAD/4QCARXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAABIAAAAAQAAAEgAAAABAAKgAgAEAAAAAQAAADmgAwAEAAAAAQAAAFEAAAAA/+0AOFBob3Rvc2hvcCAzLjAAOEJJTQQEAAAAAAAAOEJJTQQlAAAAAAAQ1B2M2Y8AsgTpgAmY7PhCfv/iAihJQ0NfUFJPRklMRQABAQAAAhgAAAAABDAAAG1udHJSR0IgWFlaIAAAAAAAAAAAAAAAAGFjc3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD21gABAAAAANMtAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACWRlc2MAAADwAAAAdHJYWVoAAAFkAAAAFGdYWVoAAAF4AAAAFGJYWVoAAAGMAAAAFHJUUkMAAAGgAAAAKGdUUkMAAAGgAAAAKGJUUkMAAAGgAAAAKHd0cHQAAAHIAAAAFGNwcnQAAAHcAAAAPG1sdWMAAAAAAAAAAQAAAAxlblVTAAAAWAAAABwAcwBSAEcAQgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWFlaIAAAAAAAAG+iAAA49QAAA5BYWVogAAAAAAAAYpkAALeFAAAY2lhZWiAAAAAAAAAkoAAAD4QAALbPcGFyYQAAAAAABAAAAAJmZgAA8qcAAA1ZAAAT0AAAClsAAAAAAAAAAFhZWiAAAAAAAAD21gABAAAAANMtbWx1YwAAAAAAAAABAAAADGVuVVMAAAAgAAAAHABHAG8AbwBnAGwAZQAgAEkAbgBjAC4AIAAyADAAMQA2/8AAEQgAUQA5AwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMAEAsMDgwKEA4NDhIREBMYKBoYFhYYMSMlHSg6Mz08OTM4N0BIXE5ARFdFNzhQbVFXX2JnaGc+TXF5cGR4XGVnY//bAEMBERISGBUYLxoaL2NCOEJjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY//dAAQABP/aAAwDAQACEQMRAD8AdRRRX0B4gUUUUAFFFFABRRRQB//QdRRRX0B4gUUUUAFFFFABRRRQB//RdRRRX0B4gUUUUAFFFFABRRRQB//SdRRRX0B4gUUUUAFFFFABRRRQB//TdRRRX0B4gUUUUAFFFFAwooooA//UdRRRX0B4gUUUUAFFFFAwooooA//Z', 'base64'); // Binary data string
  const jpegBlobFile = new Blob([binaryString], { type: 'image/jpeg' });
  const obj = { hello: 'world' };
  const jsonBlobFile = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });

  it('should render', () => {
    wrapper = mount(FileSelector, {
      props:   { label: 'upload' },
      methods: {},
      global:  { mocks: {} },
    });

    const uploadButton = wrapper.find('.btn');

    expect(wrapper.isVisible()).toBe(true);
    expect(uploadButton.exists()).toBeTruthy();
  });

  it('should succeed when loading an image', async() => {
    wrapper = mount(FileSelector, {
      props:   { label: 'upload', accept: 'image/jpeg,image/png,image/svg+xml' },
      methods: {},
      global:  { mocks: {} },
    });
    const readAsTextSpy = jest.spyOn(FileReader.prototype, 'readAsText');

    const event = {
      target: {
        files: [
          jpegBlobFile
        ]
      }
    };

    await wrapper.vm.fileChange(event);
    expect(wrapper.emitted('selected')).toHaveLength(1);
    expect(readAsTextSpy).toHaveBeenCalledWith(jpegBlobFile);
  });

  it('should fail when file is too big', async() => {
    wrapper = mount(FileSelector, {
      props: {
        label: 'upload', accept: 'image/jpeg,image/png,image/svg+xml', byteLimit: 10
      },
      methods: {},
      global:  { mocks: {} },
    });
    const readAsTextSpy = jest.spyOn(FileReader.prototype, 'readAsText');

    const event = {
      target: {
        files: [
          jpegBlobFile
        ]
      }
    };

    await wrapper.vm.fileChange(event);
    expect(wrapper.emitted('error')).toHaveLength(1);
    expect(readAsTextSpy).not.toHaveBeenCalledWith(jsonBlobFile);
  });
});
