pipeline {
  agent any
  
  stages {
    stage('Smoke'){
      echo 'Smoke'
    }
    stage('Install dependencies') {
      steps {
        npm install
      }
    }
    stage('Run unit tests'){
      steps {
        npm test
      }
    }
  }
}
