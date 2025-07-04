#!/bin/bash

# Script de despliegue para AWS ECS
set -e

# Variables de configuración
STACK_NAME="backfutbol-nest"
ENVIRONMENT=${1:-production}
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REPOSITORY="backfutbol-nest"

echo "🚀 Iniciando despliegue de BackFutbol-Nest en AWS..."
echo "📋 Configuración:"
echo "   - Stack: $STACK_NAME"
echo "   - Environment: $ENVIRONMENT"
echo "   - Region: $AWS_REGION"
echo "   - ECR Repository: $ECR_REPOSITORY"

# Verificar que AWS CLI esté configurado
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ Error: AWS CLI no está configurado. Ejecuta 'aws configure' primero."
    exit 1
fi

# Verificar que Docker esté ejecutándose
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está ejecutándose."
    exit 1
fi

# Crear ECR repository si no existe
echo "📦 Verificando ECR repository..."
if ! aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION > /dev/null 2>&1; then
    echo "📦 Creando ECR repository..."
    aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION
fi

# Obtener ECR login token
echo "🔐 Obteniendo token de ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com

# Construir imagen Docker
echo "🏗️ Construyendo imagen Docker..."
docker build -t $ECR_REPOSITORY:latest .

# Taggear imagen para ECR
ECR_URI=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY
docker tag $ECR_REPOSITORY:latest $ECR_URI:latest

# Subir imagen a ECR
echo "📤 Subiendo imagen a ECR..."
docker push $ECR_URI:latest

# Desplegar CloudFormation stack
echo "☁️ Desplegando CloudFormation stack..."
aws cloudformation deploy \
    --template-file aws-deployment.yml \
    --stack-name $STACK_NAME-$ENVIRONMENT \
    --parameter-overrides \
        Environment=$ENVIRONMENT \
        DatabaseHost=$DATABASE_HOST \
        DatabaseName=$DATABASE_NAME \
        DatabaseUsername=$DATABASE_USERNAME \
        DatabasePassword=$DATABASE_PASSWORD \
        BackUPyUCUrl=$BACK_UPYUC_URL \
        BackMPUrl=$BACK_MP_URL \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $AWS_REGION

# Obtener outputs del stack
echo "📊 Obteniendo información del despliegue..."
LOAD_BALANCER_DNS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME-$ENVIRONMENT \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
    --output text)

echo "✅ Despliegue completado exitosamente!"
echo "🌐 URL del servicio: http://$LOAD_BALANCER_DNS"
echo "📖 Documentación Swagger: http://$LOAD_BALANCER_DNS/api"
echo "💚 Health Check: http://$LOAD_BALANCER_DNS/api/v1/health"

# Verificar que el servicio esté saludable
echo "🔍 Verificando salud del servicio..."
sleep 30
if curl -f http://$LOAD_BALANCER_DNS/api/v1/health > /dev/null 2>&1; then
    echo "✅ Servicio saludable y funcionando correctamente!"
else
    echo "⚠️ El servicio no responde aún. Puede tomar unos minutos para estar completamente disponible."
fi 