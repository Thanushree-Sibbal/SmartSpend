import axios from "axios";

const API = axios.create({
  baseURL: "https://smartspend-dms3.onrender.com/api"
});

API.interceptors.request.use((req) => {

  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;

});

export const getTransactions = async () => {
  const res = await API.get("/transactions");
  return res.data;
};

export const addTransaction = async (transaction) => {
  const res = await API.post("/transactions", transaction);
  return res.data;
};
export const getAccount = async () => {
  const res = await API.get("/account");
  return res.data;
};


export const connectDemoUPI = async (accountData) => {
  const res = await API.post(
    "/account/connect-demo",
    accountData
  );

  return res.data;
};


export const syncAccountBalance = async (balance) => {
  const res = await API.post(
    "/account/sync",
    { balance }
  );

  return res.data;
};


export const disconnectAccount = async () => {
  const res = await API.post(
    "/account/disconnect"
  );

  return res.data;
};
export const getNearbyPlaces = async (params = {}) => {
  const res = await API.get("/places", {
    params
  });

  return res.data;
};
export const getSavingsGoals = async () => {
  const res = await API.get("/savings-goals");
  return res.data;
};

export const createSavingsGoal = async (goal) => {
  const res = await API.post("/savings-goals", goal);
  return res.data;
};

export const depositSavingsGoal = async (goalId, amount) => {
  const res = await API.post(
    `/savings-goals/${goalId}/deposit`,
    { amount }
  );
  return res.data;
};

export const deleteSavingsGoal = async (goalId) => {
  const res = await API.delete(
    `/savings-goals/${goalId}`
  );
  return res.data;
};