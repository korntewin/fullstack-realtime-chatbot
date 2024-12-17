"use client";

import styled from "styled-components";
import useStore, { ModelParams } from "@/stores/statestore";
import { useShallow } from "zustand/shallow";
import { useQuery } from "react-query";
import axios from "axios";
import { LLMSchema } from "@/app/api/llm/params/route";
import { useEffect } from "react";

export default function ParameterAdjustment() {
  const allParamNames: {
    fieldName: keyof ModelParams;
    step: string;
    displayName: string;
  }[] = [
    { fieldName: "outputLength", step: "1", displayName: "Output Length" },
    { fieldName: "temperature", step: "0.01", displayName: "Temperature" },
    { fieldName: "topK", step: "1", displayName: "Top K" },
    { fieldName: "topP", step: "0.01", displayName: "Top P" },
    {
      fieldName: "repetitionPenalty",
      step: "0.01",
      displayName: "Repetition Penalty",
    },
  ];

  const { modelParams, setModelParams, setModelName, modelName } = useStore(
    useShallow((state) => ({
      modelParams: state.modelParams,
      setModelParams: state.setModelParams,
      setModelName: state.setModelName,
      modelName: state.modelName,
    }))
  );

  // Fetch model parameters from backend
  const { data, error, isLoading } = useQuery<LLMSchema[]>(
    "fetchModelParams",
    async () => {
      const response = await axios.get("/api/llm/params");
      return response.data;
    }
  );

  // Set initial value for modelName
  useEffect(() => {
    if (data && data.length > 0 && !modelName.shortname) {
      setModelName({
        shortname: data[0].shortname,
        fullname: data[0].fullname,
      });
      setModelParams({
        outputLength: data[0].params.outputLength.default,
        temperature: data[0].params.temperature.default,
        topK: data[0].params.topK.default,
        topP: data[0].params.topP.default,
        repetitionPenalty: data[0].params.repetitionPenalty.default,
      });
    }
  }, [data, modelName, setModelName, setModelParams]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading model parameters</div>;
  }

  const handleParamChange = (field: keyof ModelParams, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setModelParams({ ...modelParams, [field]: value });
  };

  const handleNameChange = (name: string) => {
    if (data) {
      const metadata = data.find((model) => model.shortname === name);
      const metadataParams = metadata?.params;
      setModelName({ shortname: name, fullname: metadata?.fullname || "" });
      const capParams = allParamNames.reduce((acc, param) => {
        acc[param.fieldName] = Math.min(
          Math.max(
            metadataParams?.[param.fieldName].min,
            modelParams[param.fieldName]
          ),
          metadataParams?.[param.fieldName].max
        );
        return acc;
      }, {} as ModelParams);
      setModelParams(capParams);
    }
  };

  return (
    <Container>
      <ParametersLabel>Parameters</ParametersLabel>
      {!data && <div>No models found</div>}
      {data &&
        allParamNames.map((paramName) => (
          <ParameterRow key={paramName.fieldName}>
            <Label>{paramName.displayName}</Label>
            <LabelWhite>{modelParams[paramName.fieldName]}</LabelWhite>
            <Input
              id={paramName.fieldName}
              type="range"
              min={
                data?.find((model) => model.shortname === modelName.shortname)
                  ?.params[paramName.fieldName]?.min
              }
              step={paramName.step}
              max={
                data?.find((model) => model.shortname === modelName.shortname)
                  ?.params[paramName.fieldName]?.max
              }
              value={modelParams[paramName.fieldName]}
              onChange={(e) =>
                handleParamChange(
                  paramName.fieldName,
                  parseFloat(e.target.value)
                )
              }
            />
          </ParameterRow>
        ))}
      {data && (
        <ParameterRow>
          <Label htmlFor="modelName">Model Name</Label>
          <Select
            id="modelName"
            onChange={(e) => handleNameChange(e.target.value)}
            value={modelName.shortname}
          >
            {data?.map((model) => (
              <option key={model.id} value={model.shortname}>
                {model.shortname}
              </option>
            ))}
          </Select>
        </ParameterRow>
      )}
    </Container>
  );
}

const Container = styled.div`
  background-color: transparent;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  height: 100%;
  padding: 0 10px 0 10px;
  flex: 1 1 0;
`;

const ParameterRow = styled.div``;

const ParametersLabel = styled.h3`
  margin-top: 0;
  margin-bottom: 20px;
`;

const Label = styled.label`
  font-size: 14px;
  color: rgb(116, 112, 112);
  margin-right: 20px;
  margin-bottom: 20px;
`;
const LabelWhite = styled.label`
  font-size: 14px;
  color: white;
  margin-right: 20px;
  margin-bottom: 20px;
`;

const Input = styled.input`
  flex: 2;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  accent-color: #726dc2;
`;

export const Select = styled.select`
  margin-top: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 40px;
  background-color: rgb(13, 12, 12);
  color: rgb(116, 112, 112);
  font-size: 1rem;
`;
