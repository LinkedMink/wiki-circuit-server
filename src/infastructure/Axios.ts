import axios, { AxiosInstance } from "axios";
import { config } from "./Config";
import { ConfigKey } from "./ConfigKey";
import { CredentialStore } from "./CredentialStore";

const WIKIPEDIA_ARTICLE_BASE_URL = "https://en.wikipedia.org/wiki/";

const getAxiosForWikipedia = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: WIKIPEDIA_ARTICLE_BASE_URL,
    method: "GET",
    headers: {
      "User-Agent": config.getString(ConfigKey.TaskUserAgent),
    },
  });

  return instance;
};

const getAxiosForService = (baseURL: string, creds: CredentialStore): AxiosInstance => {
  const instance = axios.create({
    baseURL,
  });

  instance.interceptors.request.use(
    config => {
      (config.headers as Record<string, string>).Authorization = creds.authorization;
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    response => {
      return response;
    },
    function (error) {
      return Promise.reject(error);
    }
  );

  return instance;
};

export { getAxiosForService, getAxiosForWikipedia };
