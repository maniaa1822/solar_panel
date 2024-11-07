"use client"
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const SolarEfficiencySimulator = () => {
  const [cleaningFrequency, setCleaningFrequency] = useState<number>(6);
  const [simulationMonths, setSimulationMonths] = useState<number>(120);
  const [cleaningEnabled, setCleaningEnabled] = useState<boolean>(true);
  
  // Solar panel parameters
  const maxEfficiency = 100;
  const minEfficiency = 70;
  const monthlyDirtDegradationRate = 2;
  const yearlyPanelDegradationRate = 0.7;
  const monthlyPanelDegradationRate = yearlyPanelDegradationRate / 12;
  const baseCostPerCleaning = 100;
  const panelRatedPower = 575; // Panel rated power in Watts
  const averageDailyPeakHours = 5;
  
  const calculateBulkDiscount = (numberOfCleanings: number): number => {
    if (numberOfCleanings <= 1) return 0;
    const maxDiscount = 0.4;
    const discount = (numberOfCleanings - 1) * (maxDiscount / 23);
    return Math.min(maxDiscount, Math.max(0, discount));
  };
  
  const calculateDailyEnergy = (efficiency: number, panelDegradation: number): number => {
    const actualEfficiency = efficiency * (1 - panelDegradation);
    return (panelRatedPower * (actualEfficiency / 100) * averageDailyPeakHours) / 1000;
  };
  
  const generateData = (): Array<{ [key: string]: number }> => {
    let data = [];
    let currentEfficiency = maxEfficiency;
    let monthsSinceLastCleaning = 0;
    let totalEnergy = 0;
    let totalCost = 0;
    let cumulativePanelDegradation = 0;
    
    const cleaningsPerYear = cleaningEnabled ? 12 / cleaningFrequency : 0;
    const totalCleanings = (simulationMonths / 12) * cleaningsPerYear;
    const costPerCleaning = baseCostPerCleaning * (1 - calculateBulkDiscount(totalCleanings));
    
    for (let month = 0; month <= simulationMonths; month++) {
      cumulativePanelDegradation = month * monthlyPanelDegradationRate / 100;
      
      if (cleaningEnabled && monthsSinceLastCleaning >= cleaningFrequency) {
        currentEfficiency = maxEfficiency;
        monthsSinceLastCleaning = 0;
        totalCost += costPerCleaning;
      }
      
      const dailyEnergy = calculateDailyEnergy(currentEfficiency, cumulativePanelDegradation);
      const monthlyEnergy = dailyEnergy * 30;
      totalEnergy += monthlyEnergy;
      
      data.push({
        month,
        year: (month / 12).toFixed(1),
        efficiency: currentEfficiency,
        effectiveEfficiency: currentEfficiency * (1 - cumulativePanelDegradation),
        panelDegradation: cumulativePanelDegradation * 100,
        totalCost: Math.round(totalCost),
        monthlyEnergy: Math.round(monthlyEnergy * 100) / 100,
        totalEnergy: Math.round(totalEnergy * 100) / 100,
        cleaning: monthsSinceLastCleaning === 0 && cleaningEnabled ? 'Cleaning performed' : null,
        costPerCleaning: Math.round(costPerCleaning)
      });
      
      currentEfficiency = Math.max(
        minEfficiency,
        currentEfficiency - monthlyDirtDegradationRate
      );
      monthsSinceLastCleaning++;
    }
    
    return data;
  };

  const data = generateData();
  const totalCleanings = cleaningEnabled ? Math.floor(simulationMonths / cleaningFrequency) : 0;
  const discount = calculateBulkDiscount(totalCleanings);
  const finalTotalCost = data[data.length - 1].totalCost;
  const finalTotalEnergy = data[data.length - 1].totalEnergy;
  const averageEfficiency = data.reduce((sum, d) => sum + d.effectiveEfficiency, 0) / data.length;
  const averageMonthlyEnergy = data.reduce((sum, d) => sum + d.monthlyEnergy, 0) / data.length;
  const finalPanelDegradation = data[data.length - 1].panelDegradation;

  return (
    <div className="w-full max-w-4xl p-4 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Solar Panel Performance Analysis</h1>
      </div>

      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            checked={cleaningEnabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCleaningEnabled(e.target.checked)}
            className="rounded"
          />
          <label>
            Enable Cleaning {cleaningEnabled ? '(Active)' : '(No Cleaning)'}
          </label>
        </div>

        <div className="space-y-4">
          {cleaningEnabled && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Months between cleaning: {cleaningFrequency}
              </label>
              <input
                type="range"
                value={cleaningFrequency}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCleaningFrequency(parseInt(e.target.value))}
                min={1}
                max={12}
                className="w-full"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">
              Simulation duration: {(simulationMonths / 12).toFixed(1)} years ({simulationMonths} months)
            </label>
            <input
              type="range"
              value={simulationMonths}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSimulationMonths(parseInt(e.target.value))}
              min={12}
              max={240}
              step={12}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-blue-50 rounded">
            <h3 className="font-bold mb-2">Cleaning Status</h3>
            <p>Mode: {cleaningEnabled ? 'Active' : 'No Cleaning'}</p>
            {cleaningEnabled && (
              <>
                <p>Total cleanings: {totalCleanings}</p>
                <p>Bulk discount: {(discount * 100).toFixed(1)}%</p>
                <p>Total cost: ${finalTotalCost}</p>
              </>
            )}
          </div>
          <div className="p-4 bg-green-50 rounded">
            <h3 className="font-bold mb-2">Degradation Stats</h3>
            <p>Dirt degradation: {monthlyDirtDegradationRate}%/month</p>
            <p>Panel degradation: {yearlyPanelDegradationRate}%/year</p>
            <p>Total panel loss: {finalPanelDegradation.toFixed(1)}%</p>
            <p>Avg effective eff.: {averageEfficiency.toFixed(1)}%</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded">
            <h3 className="font-bold mb-2">Energy Production</h3>
            <p>Panel rating: {panelRatedPower}W</p>
            <p>Daily peak hours: {averageDailyPeakHours}</p>
            <p>Avg monthly: {averageMonthlyEnergy.toFixed(1)} kWh</p>
            <p>Total: {finalTotalEnergy.toFixed(1)} kWh</p>
          </div>
        </div>
        
        <div className="space-y-8">
          <div>
            <h3 className="font-bold mb-4">Efficiency Over Time</h3>
            <div className="w-full h-80">
              <LineChart
                width={800}
                height={300}
                data={data}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  label={{ value: 'Years', position: 'bottom' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  label={{ value: 'Efficiency (%)', angle: -90, position: 'left' }}
                />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="efficiency"
                  name="Dirt Efficiency"
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="effectiveEfficiency"
                  name="Effective Efficiency"
                  stroke="#dc2626" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="panelDegradation"
                  name="Panel Degradation"
                  stroke="#16a34a" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4">Energy Production</h3>
            <div className="w-full h-80">
              <LineChart
                width={800}
                height={300}
                data={data}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  label={{ value: 'Years', position: 'bottom' }}
                />
                <YAxis 
                  label={{ value: 'Energy (kWh)', angle: -90, position: 'left' }}
                />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="monthlyEnergy" 
                  name="Monthly Energy"
                  stroke="#16a34a" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalEnergy" 
                  name="Cumulative Energy"
                  stroke="#dc2626" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </div>
          </div>

          {cleaningEnabled && (
            <div>
              <h3 className="font-bold mb-4">Cumulative Cost</h3>
              <div className="w-full h-80">
                <LineChart
                  width={800}
                  height={300}
                  data={data}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="year" 
                    label={{ value: 'Years', position: 'bottom' }}
                  />
                  <YAxis 
                    label={{ value: 'Total Cost ($)', angle: -90, position: 'left' }}
                  />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="totalCost" 
                    stroke="#dc2626" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolarEfficiencySimulator;