import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const SolarEfficiencySimulator = () => {
  const [cleaningFrequency, setCleaningFrequency] = useState(6);
  const [simulationMonths, setSimulationMonths] = useState(120);
  const [cleaningEnabled, setCleaningEnabled] = useState(true);
  
  // Solar panel parameters
  const maxEfficiency = 100;
  const minEfficiency = 70;
  const monthlyDirtDegradationRate = 2; // Efficiency loss due to dirt/dust
  const yearlyPanelDegradationRate = 0.7; // Annual panel degradation (typical 0.5-0.8% per year)
  const monthlyPanelDegradationRate = yearlyPanelDegradationRate / 12; // Monthly panel degradation
  const baseCostPerCleaning = 100;
  const panelRatedPower = 400; // Watts
  const averageDailyPeakHours = 5;
  
  const calculateBulkDiscount = (numberOfCleanings) => {
    if (numberOfCleanings <= 1) return 0;
    const maxDiscount = 0.4;
    const discount = (numberOfCleanings - 1) * (maxDiscount / 23);
    return Math.min(maxDiscount, Math.max(0, discount));
  };
  
  const calculateDailyEnergy = (efficiency, panelDegradation) => {
    const actualEfficiency = efficiency * (1 - panelDegradation);
    return (panelRatedPower * (actualEfficiency / 100) * averageDailyPeakHours) / 1000;
  };
  
  const generateData = () => {
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
      // Calculate panel degradation (cumulative)
      cumulativePanelDegradation = month * monthlyPanelDegradationRate / 100;
      
      // Reset dirt-based efficiency when cleaning is due (only if cleaning is enabled)
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
      
      // Calculate dirt degradation for next month, but don't go below minimum efficiency
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
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Long-term Solar Panel Performance Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <Switch
              checked={cleaningEnabled}
              onCheckedChange={setCleaningEnabled}
              id="cleaning-mode"
            />
            <Label htmlFor="cleaning-mode">
              Enable Cleaning {cleaningEnabled ? '(Active)' : '(No Cleaning)'}
            </Label>
          </div>

          <div className="space-y-4">
            {cleaningEnabled && (
              <div>
                <label className="text-sm font-medium">
                  Months between cleaning: {cleaningFrequency}
                </label>
                <Slider
                  value={[cleaningFrequency]}
                  onValueChange={(value) => setCleaningFrequency(value[0])}
                  min={1}
                  max={12}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">
                Simulation duration: {(simulationMonths / 12).toFixed(1)} years ({simulationMonths} months)
              </label>
              <Slider
                value={[simulationMonths]}
                onValueChange={(value) => setSimulationMonths(value[0])}
                min={12}
                max={240}
                step={12}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded">
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
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-bold mb-2">Degradation Stats</h3>
              <p>Dirt degradation: {monthlyDirtDegradationRate}%/month</p>
              <p>Panel degradation: {yearlyPanelDegradationRate}%/year</p>
              <p>Total panel loss: {finalPanelDegradation.toFixed(1)}%</p>
              <p>Avg effective eff.: {averageEfficiency.toFixed(1)}%</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded">
              <h3 className="font-bold mb-2">Energy Production</h3>
              <p>Panel rating: {panelRatedPower}W</p>
              <p>Daily peak hours: {averageDailyPeakHours}</p>
              <p>Avg monthly: {averageMonthlyEnergy.toFixed(1)} kWh</p>
              <p>Total: {finalTotalEnergy.toFixed(1)} kWh</p>
            </div>
          </div>
          
          <Tabs defaultValue="efficiency" className="w-full">
            <TabsList>
              <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
              <TabsTrigger value="energy">Energy Production</TabsTrigger>
              {cleaningEnabled && <TabsTrigger value="cost">Cumulative Cost</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="efficiency">
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
            </TabsContent>
            
            <TabsContent value="energy">
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
            </TabsContent>
            
            {cleaningEnabled && (
              <TabsContent value="cost">
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
              </TabsContent>
            )}
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default SolarEfficiencySimulator;
