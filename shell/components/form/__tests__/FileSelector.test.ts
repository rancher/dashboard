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

  it('should reject binary image file when allowedFileTypes is specified', async() => {
    wrapper = mount(FileSelector, {
      props: {
        label: 'upload', allowedFileTypes: ['text/plain', 'application/json'], showGrowlError: false
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
    expect(wrapper.emitted('error')[0][0]).toContain('is not an allowed file type');
    expect(wrapper.emitted('selected')).toBeUndefined();
    expect(readAsTextSpy).not.toHaveBeenCalled();
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

  it('should succeed when loading text file', async() => {
    wrapper = mount(FileSelector, {
      props:   { label: 'upload' },
      methods: {},
      global:  { mocks: {} },
    });
    const readAsTextSpy = jest.spyOn(FileReader.prototype, 'readAsText');

    const event = {
      target: {
        files: [
          jsonBlobFile
        ]
      }
    };

    await wrapper.vm.fileChange(event);
    expect(wrapper.emitted('error')).toBeUndefined();
    expect(wrapper.emitted('selected')).toHaveLength(1);
    expect(readAsTextSpy).toHaveBeenCalledWith(jsonBlobFile);
  });

  it('should allow binary file when reading as data URL', async() => {
    wrapper = mount(FileSelector, {
      props:   { label: 'upload', readAsDataUrl: true },
      methods: {},
      global:  { mocks: {} },
    });
    const readAsDataUrlSpy = jest.spyOn(FileReader.prototype, 'readAsDataURL');

    const event = {
      target: {
        files: [
          jpegBlobFile
        ]
      }
    };

    await wrapper.vm.fileChange(event);
    expect(wrapper.emitted('error')).toBeUndefined();
    expect(wrapper.emitted('selected')).toHaveLength(1);
    expect(readAsDataUrlSpy).toHaveBeenCalledWith(jpegBlobFile);
  });

  it('should allow images when image types are in allowedFileTypes', async() => {
    wrapper = mount(FileSelector, {
      props: {
        label: 'upload', allowedFileTypes: ['image/jpeg', 'image/png'], showGrowlError: false
      },
      methods: {},
      global:  { mocks: {} },
    });

    const event = {
      target: {
        files: [
          jpegBlobFile
        ]
      }
    };

    await wrapper.vm.fileChange(event);
    expect(wrapper.emitted('error')).toBeUndefined();
    expect(wrapper.emitted('selected')).toHaveLength(1);
  });

  it('should reject PNG files when not in allowedFileTypes', async() => {
    const pngBlobFile = new Blob([binaryString], { type: 'image/png' });

    wrapper = mount(FileSelector, {
      props: {
        label: 'upload', allowedFileTypes: ['text/plain', 'application/json'], showGrowlError: false
      },
      methods: {},
      global:  { mocks: {} },
    });

    const event = {
      target: {
        files: [
          pngBlobFile
        ]
      }
    };

    await wrapper.vm.fileChange(event);
    expect(wrapper.emitted('error')).toHaveLength(1);
    expect(wrapper.emitted('error')[0][0]).toContain('is not an allowed file type');
  });

  it('should reject PDF files when not in allowedFileTypes', async() => {
    const pdfBlobFile = new Blob([binaryString], { type: 'application/pdf' });

    wrapper = mount(FileSelector, {
      props: {
        label: 'upload', allowedFileTypes: ['text/plain'], showGrowlError: false
      },
      methods: {},
      global:  { mocks: {} },
    });

    const event = {
      target: {
        files: [
          pdfBlobFile
        ]
      }
    };

    await wrapper.vm.fileChange(event);
    expect(wrapper.emitted('error')).toHaveLength(1);
    expect(wrapper.emitted('error')[0][0]).toContain('is not an allowed file type');
  });

  it('should allow all files when allowedFileTypes is not specified', async() => {
    wrapper = mount(FileSelector, {
      props:   { label: 'upload', showGrowlError: false },
      methods: {},
      global:  { mocks: {} },
    });

    const event = {
      target: {
        files: [
          jpegBlobFile
        ]
      }
    };

    await wrapper.vm.fileChange(event);
    expect(wrapper.emitted('error')).toBeUndefined();
    expect(wrapper.emitted('selected')).toHaveLength(1);
  });

  it('should support prefix matching for file types', async() => {
    wrapper = mount(FileSelector, {
      props: {
        label: 'upload', allowedFileTypes: ['image/'], showGrowlError: false
      },
      methods: {},
      global:  { mocks: {} },
    });

    const event = {
      target: {
        files: [
          jpegBlobFile
        ]
      }
    };

    await wrapper.vm.fileChange(event);
    expect(wrapper.emitted('error')).toBeUndefined();
    expect(wrapper.emitted('selected')).toHaveLength(1);
  });
});
