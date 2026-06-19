type TwoFactorStatusResponseType = {
  success: boolean;
  data: {
    methods: {
      key: string;
      active: number;
      "visible": boolean,
    }[];
  };
};

export type { TwoFactorStatusResponseType };