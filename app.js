// ML Data Visualization App JavaScript

class MLApp {
    constructor() {
        this.data = null;
        this.processedData = null;
        this.model = null;
        this.charts = {};
        this.algorithms = [
            {
                name: "Linear Regression",
                type: "regression", 
                description: "Predicts continuous values by finding the best linear relationship between features and target. Good for: House price prediction, Sales forecasting, Risk assessment"
            },
            {
                name: "Logistic Regression",
                type: "classification",
                description: "Binary and multi-class classification using logistic function for probability estimation. Good for: Email spam detection, Medical diagnosis, Customer churn prediction"
            },
            {
                name: "Decision Tree", 
                type: "both",
                description: "Tree-like model that makes decisions based on feature values, easy to interpret. Good for: Credit approval, Medical diagnosis, Feature selection"
            },
            {
                name: "Random Forest",
                type: "both", 
                description: "Ensemble method combining multiple decision trees for improved accuracy and reduced overfitting. Good for: Image recognition, Bioinformatics, E-commerce recommendations"
            },
            {
                name: "Support Vector Machine",
                type: "both",
                description: "Finds optimal hyperplane to separate classes or predict continuous values, effective in high dimensions. Good for: Text classification, Image recognition, Gene classification"
            },
            {
                name: "K-Nearest Neighbors",
                type: "both",
                description: "Makes predictions based on the K nearest neighbors in the feature space. Good for: Recommendation systems, Pattern recognition, Outlier detection"
            },
            {
                name: "Naive Bayes",
                type: "classification",
                description: "Probabilistic classifier based on Bayes theorem, assumes feature independence. Good for: Text classification, Spam filtering, Sentiment analysis"
            }
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.populateAlgorithms();
    }

    setupEventListeners() {
        // File upload
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Configuration
        document.getElementById('targetColumn').addEventListener('change', this.handleTargetChange.bind(this));
        document.getElementById('algorithmSelect').addEventListener('change', this.handleAlgorithmChange.bind(this));
        document.getElementById('splitSlider').addEventListener('input', this.handleSplitChange.bind(this));
        document.getElementById('trainModel').addEventListener('click', this.trainModel.bind(this));

        // Visualization
        document.getElementById('chartType').addEventListener('change', this.updateVisualization.bind(this));
        document.getElementById('xAxis').addEventListener('change', this.updateVisualization.bind(this));
        document.getElementById('yAxis').addEventListener('change', this.updateVisualization.bind(this));
        document.getElementById('updateChart').addEventListener('click', this.updateVisualization.bind(this));
        document.getElementById('downloadChart').addEventListener('click', this.downloadChart.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();

        document.getElementById('fileName').textContent = fileName;
        document.getElementById('fileInfo').classList.remove('hidden');

        if (fileExtension === 'csv') {
            Papa.parse(file, {
                header: true,
                complete: (results) => this.handleDataLoad(results.data),
                error: (error) => this.showError('Error parsing CSV: ' + error.message)
            });
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workbook = XLSX.read(e.target.result, { type: 'binary' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const data = XLSX.utils.sheet_to_json(firstSheet);
                    this.handleDataLoad(data);
                } catch (error) {
                    this.showError('Error parsing Excel file: ' + error.message);
                }
            };
            reader.readAsBinaryString(file);
        } else {
            this.showError('Unsupported file format. Please use CSV or XLSX files.');
        }
    }

    loadSampleDataset(datasetKey) {
        const datasets = {
            iris: {
                name: "Iris Dataset",
                data: this.generateIrisDataset(),
                target: "species",
                type: "classification"
            },
            housing: {
                name: "Housing Prices",
                data: this.generateHousingDataset(),
                target: "price",
                type: "regression"
            },
            customer: {
                name: "Customer Segmentation",
                data: this.generateCustomerDataset(),
                target: "segment",
                type: "classification"
            }
        };
        
        const dataset = datasets[datasetKey];
        if (dataset) {
            document.getElementById('fileName').textContent = dataset.name;
            document.getElementById('fileInfo').classList.remove('hidden');
            this.handleDataLoad(dataset.data);
        }
    }

    handleDataLoad(data) {
        // Filter out empty rows
        this.data = data.filter(row => {
            return Object.values(row).some(val => val !== null && val !== '' && val !== undefined);
        });
        
        if (this.data.length === 0) {
            this.showError('No valid data found in the file.');
            return;
        }
        
        this.displayDataPreview();
        this.setupConfiguration();
        this.showSection('dataPreviewSection');
        this.showSection('configSection');
    }

    displayDataPreview() {
        const stats = this.calculateDataStats();
        const statsHtml = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.rows}</div>
                    <div class="stat-label">Rows</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.columns}</div>
                    <div class="stat-label">Columns</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.numerical}</div>
                    <div class="stat-label">Numerical</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.categorical}</div>
                    <div class="stat-label">Categorical</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.missing}</div>
                    <div class="stat-label">Missing Values</div>
                </div>
            </div>
        `;
        document.getElementById('dataStats').innerHTML = statsHtml;

        // Display data table
        this.displayDataTable();
    }

    displayDataTable() {
        const columns = Object.keys(this.data[0]);
        const thead = document.getElementById('tableHead');
        const tbody = document.getElementById('tableBody');

        // Create header
        thead.innerHTML = '<tr>' + columns.map(col => `<th>${col}</th>`).join('') + '</tr>';

        // Create body (show first 10 rows)
        const rows = this.data.slice(0, 10).map(row => 
            '<tr>' + columns.map(col => `<td>${row[col] !== null && row[col] !== undefined ? row[col] : '-'}</td>`).join('') + '</tr>'
        ).join('');
        tbody.innerHTML = rows;
    }

    calculateDataStats() {
        if (!this.data || this.data.length === 0) return {};

        const columns = Object.keys(this.data[0]);
        let numerical = 0;
        let categorical = 0;
        let missing = 0;

        columns.forEach(col => {
            const values = this.data.map(row => row[col]);
            const nonNullValues = values.filter(val => val !== null && val !== '' && val !== undefined);
            missing += this.data.length - nonNullValues.length;

            if (nonNullValues.length > 0 && nonNullValues.every(val => !isNaN(parseFloat(val)) && isFinite(val))) {
                numerical++;
            } else {
                categorical++;
            }
        });

        return {
            rows: this.data.length,
            columns: columns.length,
            numerical,
            categorical,
            missing
        };
    }

    setupConfiguration() {
        const columns = Object.keys(this.data[0]);
        
        // Populate target column dropdown
        const targetSelect = document.getElementById('targetColumn');
        targetSelect.innerHTML = '<option value="">Choose target column...</option>' +
            columns.map(col => `<option value="${col}">${col}</option>`).join('');

        // Populate feature checkboxes
        const featureCheckboxes = document.getElementById('featureCheckboxes');
        featureCheckboxes.innerHTML = columns.map(col => `
            <div class="feature-checkbox">
                <input type="checkbox" id="feature_${col}" value="${col}" checked>
                <label for="feature_${col}">${col}</label>
            </div>
        `).join('');

        // Populate visualization axes
        this.populateAxisSelectors(columns);
    }

    populateAxisSelectors(columns) {
        const xAxis = document.getElementById('xAxis');
        const yAxis = document.getElementById('yAxis');
        
        const options = columns.map(col => `<option value="${col}">${col}</option>`).join('');
        xAxis.innerHTML = options;
        yAxis.innerHTML = options;
        
        if (columns.length > 1) {
            yAxis.selectedIndex = 1;
        }
    }

    populateAlgorithms() {
        const algorithmSelect = document.getElementById('algorithmSelect');
        algorithmSelect.innerHTML = '<option value="">Choose algorithm...</option>' +
            this.algorithms.map(alg => `<option value="${alg.name}">${alg.name}</option>`).join('');
    }

    handleTargetChange() {
        this.updateTrainButtonState();
    }

    handleAlgorithmChange() {
        const selectedAlgorithm = document.getElementById('algorithmSelect').value;
        const algorithm = this.algorithms.find(alg => alg.name === selectedAlgorithm);
        
        if (algorithm) {
            document.getElementById('algorithmDescription').innerHTML = algorithm.description;
        } else {
            document.getElementById('algorithmDescription').innerHTML = '';
        }
        
        this.updateTrainButtonState();
    }

    handleSplitChange() {
        const value = document.getElementById('splitSlider').value;
        document.getElementById('splitValue').textContent = `${value}/${100 - value}`;
    }

    updateTrainButtonState() {
        const targetColumn = document.getElementById('targetColumn').value;
        const algorithm = document.getElementById('algorithmSelect').value;
        const trainButton = document.getElementById('trainModel');
        
        trainButton.disabled = !targetColumn || !algorithm;
    }

    async trainModel() {
        const targetColumn = document.getElementById('targetColumn').value;
        const algorithmName = document.getElementById('algorithmSelect').value;
        const splitRatio = parseInt(document.getElementById('splitSlider').value) / 100;

        // Get selected features
        const selectedFeatures = Array.from(document.querySelectorAll('#featureCheckboxes input:checked'))
            .map(cb => cb.value)
            .filter(feature => feature !== targetColumn);

        if (selectedFeatures.length === 0) {
            this.showError('Please select at least one feature.');
            return;
        }

        // Show progress
        this.showTrainingProgress();

        // Simulate training time
        await this.simulateTraining();

        // Process data and train model
        this.processedData = this.prepareData(selectedFeatures, targetColumn, splitRatio);
        this.model = this.createModel(algorithmName, this.processedData);

        // Calculate metrics
        const metrics = this.calculateMetrics(this.model, this.processedData);

        // Display results
        this.displayResults(metrics);
        this.setupVisualization();

        // Hide progress and show results
        this.hideTrainingProgress();
        this.showSection('resultsSection');
        this.showSection('visualizationSection');
        this.showSection('additionalChartsSection');
    }

    async simulateTraining() {
        const progressFill = document.getElementById('progressFill');
        for (let i = 0; i <= 100; i += 10) {
            progressFill.style.width = i + '%';
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    showTrainingProgress() {
        document.getElementById('trainingProgress').classList.remove('hidden');
    }

    hideTrainingProgress() {
        document.getElementById('trainingProgress').classList.add('hidden');
    }

    prepareData(features, target, splitRatio) {
        // Clean and prepare data
        const cleanData = this.data.filter(row => 
            features.every(feature => row[feature] !== null && row[feature] !== '' && row[feature] !== undefined) &&
            row[target] !== null && row[target] !== '' && row[target] !== undefined
        );

        // Convert numerical features
        const processedData = cleanData.map(row => {
            const processedRow = { [target]: row[target] };
            features.forEach(feature => {
                const value = row[feature];
                processedRow[feature] = isNaN(parseFloat(value)) ? value : parseFloat(value);
            });
            return processedRow;
        });

        // Split data
        const shuffled = this.shuffleArray([...processedData]);
        const splitIndex = Math.floor(shuffled.length * splitRatio);
        
        return {
            trainData: shuffled.slice(0, splitIndex),
            testData: shuffled.slice(splitIndex),
            features,
            target,
            taskType: this.detectTaskType(processedData, target)
        };
    }

    detectTaskType(data, target) {
        const uniqueValues = [...new Set(data.map(row => row[target]))];
        const isNumeric = uniqueValues.every(val => !isNaN(parseFloat(val)) && isFinite(val));
        
        if (isNumeric && uniqueValues.length > 10) {
            return 'regression';
        } else {
            return 'classification';
        }
    }

    createModel(algorithmName, processedData) {
        // Mock ML model implementations
        const model = {
            algorithm: algorithmName,
            taskType: processedData.taskType,
            features: processedData.features,
            target: processedData.target
        };

        if (processedData.taskType === 'classification') {
            model.predictions = this.mockClassificationPredictions(processedData);
        } else {
            model.predictions = this.mockRegressionPredictions(processedData);
        }

        return model;
    }

    mockClassificationPredictions(data) {
        const classes = [...new Set(data.trainData.map(row => row[data.target]))];
        const predictions = data.testData.map(() => 
            classes[Math.floor(Math.random() * classes.length)]
        );
        
        // Add some accuracy by making 70-90% of predictions correct
        const accuracy = 0.7 + Math.random() * 0.2;
        const correctCount = Math.floor(predictions.length * accuracy);
        
        for (let i = 0; i < correctCount; i++) {
            predictions[i] = data.testData[i][data.target];
        }

        return predictions;
    }

    mockRegressionPredictions(data) {
        const actualValues = data.testData.map(row => parseFloat(row[data.target]));
        const mean = actualValues.reduce((sum, val) => sum + val, 0) / actualValues.length;
        const std = Math.sqrt(actualValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / actualValues.length);
        
        // Generate predictions with some noise
        return actualValues.map(actual => {
            const noise = (Math.random() - 0.5) * std * 0.3;
            return actual + noise;
        });
    }

    calculateMetrics(model, processedData) {
        if (model.taskType === 'classification') {
            return this.calculateClassificationMetrics(model, processedData);
        } else {
            return this.calculateRegressionMetrics(model, processedData);
        }
    }

    calculateClassificationMetrics(model, processedData) {
        const actual = processedData.testData.map(row => row[processedData.target]);
        const predicted = model.predictions;
        
        const accuracy = predicted.filter((pred, i) => pred === actual[i]).length / predicted.length;
        
        // Mock other metrics
        const precision = 0.75 + Math.random() * 0.2;
        const recall = 0.7 + Math.random() * 0.25;
        const f1Score = 2 * (precision * recall) / (precision + recall);

        return {
            accuracy: accuracy.toFixed(3),
            precision: precision.toFixed(3),
            recall: recall.toFixed(3),
            f1Score: f1Score.toFixed(3)
        };
    }

    calculateRegressionMetrics(model, processedData) {
        const actual = processedData.testData.map(row => parseFloat(row[processedData.target]));
        const predicted = model.predictions;
        
        const mse = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0) / actual.length;
        const rmse = Math.sqrt(mse);
        const mae = actual.reduce((sum, val, i) => sum + Math.abs(val - predicted[i]), 0) / actual.length;
        
        const actualMean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
        const totalSumSquares = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
        const residualSumSquares = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
        const r2 = 1 - (residualSumSquares / totalSumSquares);

        return {
            r2: r2.toFixed(3),
            mse: mse.toFixed(3),
            rmse: rmse.toFixed(3),
            mae: mae.toFixed(3)
        };
    }

    displayResults(metrics) {
        const metricsGrid = document.getElementById('metricsGrid');
        let metricsHtml = '';

        if (this.model.taskType === 'classification') {
            metricsHtml = `
                <div class="metric-card">
                    <div class="metric-value">${(parseFloat(metrics.accuracy) * 100).toFixed(1)}%</div>
                    <div class="metric-label">Accuracy</div>
                    <div class="metric-description">Percentage of correct predictions</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${(parseFloat(metrics.precision) * 100).toFixed(1)}%</div>
                    <div class="metric-label">Precision</div>
                    <div class="metric-description">True positives / (TP + FP)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${(parseFloat(metrics.recall) * 100).toFixed(1)}%</div>
                    <div class="metric-label">Recall</div>
                    <div class="metric-description">True positives / (TP + FN)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${(parseFloat(metrics.f1Score) * 100).toFixed(1)}%</div>
                    <div class="metric-label">F1-Score</div>
                    <div class="metric-description">Harmonic mean of precision and recall</div>
                </div>
            `;
        } else {
            metricsHtml = `
                <div class="metric-card">
                    <div class="metric-value">${(parseFloat(metrics.r2) * 100).toFixed(1)}%</div>
                    <div class="metric-label">R² Score</div>
                    <div class="metric-description">Coefficient of determination</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${parseFloat(metrics.mse).toFixed(2)}</div>
                    <div class="metric-label">MSE</div>
                    <div class="metric-description">Mean Squared Error</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${parseFloat(metrics.rmse).toFixed(2)}</div>
                    <div class="metric-label">RMSE</div>
                    <div class="metric-description">Root Mean Squared Error</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${parseFloat(metrics.mae).toFixed(2)}</div>
                    <div class="metric-label">MAE</div>
                    <div class="metric-description">Mean Absolute Error</div>
                </div>
            `;
        }

        metricsGrid.innerHTML = metricsHtml;
    }

    setupVisualization() {
        this.createMainChart();
        this.createAdvancedCharts();
    }

    updateVisualization() {
        this.createMainChart();
    }

    createMainChart() {
        const chartType = document.getElementById('chartType').value;
        const xAxis = document.getElementById('xAxis').value;
        const yAxis = document.getElementById('yAxis').value;

        const ctx = document.getElementById('mainChart').getContext('2d');
        
        if (this.charts.main) {
            this.charts.main.destroy();
        }

        const chartData = this.prepareChartData(chartType, xAxis, yAxis);
        
        this.charts.main = new Chart(ctx, {
            type: this.getChartType(chartType),
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${this.getChartTitle(chartType)} - ${xAxis} vs ${yAxis}`
                    },
                    legend: {
                        display: chartType !== 'histogram'
                    }
                },
                scales: this.getScaleConfig(chartType)
            }
        });
    }

    prepareChartData(chartType, xAxis, yAxis) {
        const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];
        
        if (chartType === 'scatter') {
            return {
                datasets: [{
                    label: `${xAxis} vs ${yAxis}`,
                    data: this.data.map(row => ({
                        x: parseFloat(row[xAxis]) || 0,
                        y: parseFloat(row[yAxis]) || 0
                    })),
                    backgroundColor: colors[0],
                    borderColor: colors[0]
                }]
            };
        } else if (chartType === 'histogram') {
            const values = this.data.map(row => parseFloat(row[xAxis])).filter(val => !isNaN(val));
            const bins = this.createHistogramBins(values, 10);
            
            return {
                labels: bins.map(bin => `${bin.min.toFixed(1)}-${bin.max.toFixed(1)}`),
                datasets: [{
                    label: `Frequency of ${xAxis}`,
                    data: bins.map(bin => bin.count),
                    backgroundColor: colors[1],
                    borderColor: colors[1],
                    borderWidth: 1
                }]
            };
        } else {
            // Bar and line charts
            const groupedData = this.groupDataByCategory(xAxis, yAxis);
            
            return {
                labels: Object.keys(groupedData),
                datasets: [{
                    label: yAxis,
                    data: Object.values(groupedData),
                    backgroundColor: colors.slice(0, Object.keys(groupedData).length),
                    borderColor: colors.slice(0, Object.keys(groupedData).length),
                    borderWidth: 1
                }]
            };
        }
    }

    getChartType(chartType) {
        const mapping = {
            scatter: 'scatter',
            bar: 'bar',
            line: 'line',
            histogram: 'bar',
            boxplot: 'bar',
            heatmap: 'bar'
        };
        return mapping[chartType] || 'bar';
    }

    getChartTitle(chartType) {
        const titles = {
            scatter: 'Scatter Plot',
            bar: 'Bar Chart',
            line: 'Line Chart',
            histogram: 'Histogram',
            boxplot: 'Box Plot',
            heatmap: 'Heatmap'
        };
        return titles[chartType] || 'Chart';
    }

    getScaleConfig(chartType) {
        if (chartType === 'scatter') {
            return {
                x: { type: 'linear', position: 'bottom' },
                y: { type: 'linear' }
            };
        }
        return {};
    }

    createHistogramBins(values, binCount) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binWidth = (max - min) / binCount;
        
        const bins = [];
        for (let i = 0; i < binCount; i++) {
            const binMin = min + i * binWidth;
            const binMax = min + (i + 1) * binWidth;
            const count = values.filter(val => val >= binMin && (i === binCount - 1 ? val <= binMax : val < binMax)).length;
            bins.push({ min: binMin, max: binMax, count });
        }
        
        return bins;
    }

    groupDataByCategory(categoryColumn, valueColumn) {
        const grouped = {};
        this.data.forEach(row => {
            const category = row[categoryColumn];
            const value = parseFloat(row[valueColumn]) || 0;
            
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(value);
        });
        
        // Calculate averages for each category
        Object.keys(grouped).forEach(category => {
            const values = grouped[category];
            grouped[category] = values.reduce((sum, val) => sum + val, 0) / values.length;
        });
        
        return grouped;
    }

    createAdvancedCharts() {
        this.createFeatureImportanceChart();
        this.createConfusionMatrixChart();
        this.createLearningCurveChart();
        this.createROCCurveChart();
    }

    createFeatureImportanceChart() {
        const ctx = document.getElementById('featureImportanceChart').getContext('2d');
        
        if (this.charts.featureImportance) {
            this.charts.featureImportance.destroy();
        }

        const importances = this.processedData.features.map(() => Math.random());
        const totalImportance = importances.reduce((sum, val) => sum + val, 0);
        const normalizedImportances = importances.map(val => val / totalImportance);

        this.charts.featureImportance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.processedData.features,
                datasets: [{
                    label: 'Importance',
                    data: normalizedImportances,
                    backgroundColor: '#1FB8CD',
                    borderColor: '#1FB8CD',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createConfusionMatrixChart() {
        if (this.model.taskType !== 'classification') return;
        
        const ctx = document.getElementById('confusionMatrixChart').getContext('2d');
        
        if (this.charts.confusionMatrix) {
            this.charts.confusionMatrix.destroy();
        }

        // Mock confusion matrix data
        const classes = [...new Set(this.processedData.testData.map(row => row[this.processedData.target]))];
        const matrix = this.generateMockConfusionMatrix(classes);

        this.charts.confusionMatrix = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: classes,
                datasets: classes.map((cls, idx) => ({
                    label: `Predicted ${cls}`,
                    data: matrix[idx],
                    backgroundColor: `rgba(31, 184, 205, ${0.3 + idx * 0.2})`
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true },
                    y: { stacked: true }
                }
            }
        });
    }

    createLearningCurveChart() {
        const ctx = document.getElementById('learningCurveChart').getContext('2d');
        
        if (this.charts.learningCurve) {
            this.charts.learningCurve.destroy();
        }

        const trainingPoints = Array.from({length: 10}, (_, i) => (i + 1) * 10);
        const trainingScores = trainingPoints.map(() => 0.6 + Math.random() * 0.3);
        const validationScores = trainingPoints.map(() => 0.5 + Math.random() * 0.35);

        this.charts.learningCurve = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trainingPoints,
                datasets: [{
                    label: 'Training Score',
                    data: trainingScores,
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    fill: false
                }, {
                    label: 'Validation Score',
                    data: validationScores,
                    borderColor: '#FFC185',
                    backgroundColor: 'rgba(255, 193, 133, 0.1)',
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'Training Examples' } },
                    y: { title: { display: true, text: 'Score' } }
                }
            }
        });
    }

    createROCCurveChart() {
        if (this.model.taskType !== 'classification') return;
        
        const ctx = document.getElementById('rocCurveChart').getContext('2d');
        
        if (this.charts.rocCurve) {
            this.charts.rocCurve.destroy();
        }

        // Generate mock ROC curve data
        const rocData = Array.from({length: 100}, (_, i) => {
            const fpr = i / 100;
            const tpr = Math.min(1, fpr + 0.3 + Math.random() * 0.4);
            return { x: fpr, y: tpr };
        });

        this.charts.rocCurve = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'ROC Curve',
                    data: rocData,
                    borderColor: '#B4413C',
                    backgroundColor: 'rgba(180, 65, 60, 0.1)',
                    fill: false
                }, {
                    label: 'Random Classifier',
                    data: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
                    borderColor: '#5D878F',
                    borderDash: [5, 5],
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { 
                        type: 'linear',
                        title: { display: true, text: 'False Positive Rate' }
                    },
                    y: { 
                        type: 'linear',
                        title: { display: true, text: 'True Positive Rate' }
                    }
                }
            }
        });
    }

    generateMockConfusionMatrix(classes) {
        const matrix = [];
        for (let i = 0; i < classes.length; i++) {
            const row = [];
            for (let j = 0; j < classes.length; j++) {
                if (i === j) {
                    row.push(20 + Math.floor(Math.random() * 30)); // True positives
                } else {
                    row.push(Math.floor(Math.random() * 10)); // False positives/negatives
                }
            }
            matrix.push(row);
        }
        return matrix;
    }

    downloadChart() {
        if (this.charts.main) {
            const link = document.createElement('a');
            link.download = 'chart.png';
            link.href = this.charts.main.toBase64Image();
            link.click();
        }
    }

    showSection(sectionId) {
        document.getElementById(sectionId).classList.remove('hidden');
    }

    showError(message) {
        alert(message); // Simple error handling
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Sample dataset generators
    generateIrisDataset() {
        const species = ['setosa', 'versicolor', 'virginica'];
        const data = [];
        
        for (let i = 0; i < 150; i++) {
            const speciesIndex = Math.floor(i / 50);
            const baseValues = speciesIndex === 0 ? [5.0, 3.4, 1.5, 0.2] :
                              speciesIndex === 1 ? [6.0, 2.8, 4.0, 1.3] :
                                                   [6.5, 3.0, 5.5, 2.0];
            
            data.push({
                sepal_length: (baseValues[0] + (Math.random() - 0.5) * 1.0).toFixed(1),
                sepal_width: (baseValues[1] + (Math.random() - 0.5) * 0.8).toFixed(1),
                petal_length: (baseValues[2] + (Math.random() - 0.5) * 1.0).toFixed(1),
                petal_width: (baseValues[3] + (Math.random() - 0.5) * 0.5).toFixed(1),
                species: species[speciesIndex]
            });
        }
        return data;
    }

    generateHousingDataset() {
        const data = [];
        for (let i = 0; i < 200; i++) {
            const rooms = 3 + Math.floor(Math.random() * 5);
            const age = Math.floor(Math.random() * 50);
            const distance = (1 + Math.random() * 10).toFixed(1);
            const tax = 200 + Math.floor(Math.random() * 600);
            const crime_rate = (Math.random() * 20).toFixed(2);
            
            const price = Math.floor(
                100000 + rooms * 25000 - age * 1000 + 
                (10 - parseFloat(distance)) * 5000 - 
                tax * 50 - parseFloat(crime_rate) * 2000 +
                Math.random() * 50000
            );
            
            data.push({
                rooms: rooms.toString(),
                age: age.toString(),
                distance,
                tax: tax.toString(),
                crime_rate,
                price: price.toString()
            });
        }
        return data;
    }

    generateCustomerDataset() {
        const segments = ['Basic', 'Premium', 'Enterprise'];
        const data = [];
        
        for (let i = 0; i < 200; i++) {
            const age = 20 + Math.floor(Math.random() * 60);
            const income = 25000 + Math.floor(Math.random() * 100000);
            const spending_score = Math.floor(Math.random() * 100);
            const work_experience = Math.floor(Math.random() * 40);
            
            let segment;
            if (income > 80000 && spending_score > 70) segment = 'Enterprise';
            else if (income > 50000 && spending_score > 40) segment = 'Premium';
            else segment = 'Basic';
            
            data.push({
                age: age.toString(),
                income: income.toString(),
                spending_score: spending_score.toString(),
                work_experience: work_experience.toString(),
                segment
            });
        }
        return data;
    }
}

// Global function for sample dataset loading
function loadSampleDataset(datasetKey) {
    const app = window.mlApp;
    if (app) {
        app.loadSampleDataset(datasetKey);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.mlApp = new MLApp();
});

document.getElementById("downloadAdvancedBtn").addEventListener("click", () => {
    const section = document.getElementById("additionalChartsSection");

    html2canvas(section, {
        backgroundColor: "#fff", // Ensure white background for image
        scale: 2                 // Higher resolution
    }).then(canvas => {
        const link = document.createElement("a");
        link.download = "advanced_visualizations.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    }).catch(err => {
        alert("Failed to capture visualizations: " + err.message);
    });
});
