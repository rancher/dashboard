class RichardsLogger {
  private enabled = true;

  enable(enable: boolean) {
    this.enabled = enable;
  }

  warn() {
    if (this.enabled) {
      console.warn('CUSTOM', ...arguments);//, new Error()
    }
  }
}

const logger = new RichardsLogger();

export default logger;
