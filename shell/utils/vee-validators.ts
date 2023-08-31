import { validate } from 'vee-validate';

export interface VeeTokenRule {
  id: string;
}

export async function veeTokenValidateUtil(
  value: any,
  rule: any,
  getters: any
): Promise<any> {
  const params = {
    value: value[rule.path],
    getters,
  };

  const res = await validate(params, rule.rules);

  return res;
}
