class RichardsLogger {
  private enabled = true;

  enable(enable: boolean) {
    this.enabled = enable;
  }

  warn() {
    if (this.enabled) {
      console.warn('CUSTOM', ...arguments)
    }
  }

}

const logger = new RichardsLogger();

export default logger;