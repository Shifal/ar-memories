import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import AddMemoryScreen from "../../screens/AddMemoryScreen";

export default function Add() {
  const { token } = useAuth();
  return <AddMemoryScreen token={token!} />;
}