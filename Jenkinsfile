pipeline {
    agent any

    environment {
        APP_NAME = "pde_be_app"
        SONAR_PROJECT_KEY = "PDE_BE_VERSION_UPGRADE"   // ✅ FIXED (uppercase)
        SONAR_HOST_URL = "http://10.10.120.190:9000"
        PATH = "/usr/bin:/usr/local/bin:${env.PATH}"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                url: 'https://github.com/SantoshKumar9290/PDE_BE_VERSION_UPGRADE.git'
            }
        }

        stage('Check Node') {
            steps {
                sh '''
                    node -v
                    npm -v
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv('Sonar-Server') {
                    sh '''
                        /opt/sonarscanner/sonar-scanner-5.0.1.3006-linux/bin/sonar-scanner \
                        -Dsonar.projectKey=$SONAR_PROJECT_KEY \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=$SONAR_HOST_URL \
                        -Dsonar.login=$SONAR_AUTH_TOKEN
                    '''
                }
            }
        }

        stage('Deploy with PM2') {
            steps {
                sh '''
                    pm2 delete pde_be_app || true
                    pm2 start ecosystem.config.js
                    pm2 save
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Build + Sonar + Deploy SUCCESS"
        }
        failure {
            echo "❌ Pipeline FAILED"
        }
    }
}
