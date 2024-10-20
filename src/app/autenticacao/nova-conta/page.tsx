
'use client';
import React, { useState } from 'react';
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO, isBefore, subYears } from 'date-fns';
import Footer from '@/components/Footer';
import ErrorModal from '@/components/ErrorModal';

const eighteenYearsAgo = subYears(new Date(), 18);

const schema = z.object({
  name: z.string()
    .min(3, "O nome deve ter no mínimo 3 caracteres")
    .max(50, "O nome deve ter no máximo 50 caracteres")
    .refine((val) => /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(val), {
      message: "O nome não deve conter números ou caracteres especiais",
    }),
  socialName: z.string().optional(),

  email: z
    .string()
    .email("Digite um e-mail válido")
    .min(1, "Campo obrigatório"),

  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "A confirmação de senha deve ter pelo menos 6 caracteres"),

  cpf: z.string().length(11, "O CPF deve ter 11 caracteres").regex(/^\d{11}$/, "O CPF deve conter apenas números"),

  gender: z.enum(["M", "F"]).refine(val => ["M", "F"].includes(val), {
    message: "Selecione um gênero",
  }),

  birthDate: z
    .string()
    .refine((date) => isBefore(parseISO(date), eighteenYearsAgo), {
      message: "Você deve ter pelo menos 18 anos",
    }),

  cel: z.string()
    .length(11, "O celular deve ter 11 caracteres")
    .refine((val) => /^[0-9]+$/
      .test(val), {
      message: "O telefone deve conter apenas números",
    }),

  address: z.object({
    street: z.string().min(1, "Rua é obrigatória"),
    number: z.string().min(1, "Número é obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().min(3, "Bairro é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
    state: z.string().min(2, "Estado é obrigatório"),
    zipCode: z.string().length(8, "CEP deve ter 8 caracteres"),
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type CreateAccountInputs = {
  name: string;
  socialName?: string;
  email: string;
  password: string;
  confirmPassword: string;
  cpf: string;
  gender: "M" | "F";
  birthDate: string;
  cel: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
};

const states = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO"
];

const CreateAccountForm: React.FC = () => {
  const [addressError, setAddressError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showModalSucess, setShowModalSucess] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<CreateAccountInputs>({
    resolver: zodResolver(schema),
  });

  const router = useRouter();

  const handleCepChange = async (cep: string) => {
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (data.erro) {
          setAddressError("CEP não encontrado.");
        } else {
          setAddressError(null);
          setValue('address.street', data.logradouro || '');
          setValue('address.neighborhood', data.bairro || '');
          setValue('address.city', data.localidade || '');
          setValue('address.state', data.uf || '');
        }
      } catch (error) {
        setAddressError("Erro ao buscar endereço.");
      }
    }
  };

  const onSubmit: SubmitHandler<CreateAccountInputs> = async (data) => {
    console.log('Dados enviados para o backend:', data);
    try {
      console.log('Enviando dados para o backend...');
      const response = await fetch('/api/public/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro no servidor:', errorData);
        setServerError(errorData.message || 'Erro ao criar usuário. Tente novamente mais tarde.');
        setShowModal(true);
        throw new Error(errorData.message || 'Erro ao criar usuário. Tente novamente mais tarde.');
      }

      const result = await response.json();

      if (result.success) {
        setModalMessage('Usuário criado com sucesso!');
        setShowModalSucess(true);
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setServerError(result.message);
        setShowModal(true);
        console.error(result.message);
      }
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      setServerError('Erro ao criar conta. Tente novamente mais tarde.');
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="py-10 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 md:py-12 w-full">
        <div className='flex justify-between'>
          <img src="/images/logo3.png" alt="background" />
          <button onClick={() => router.push("/")} className='text-white bg-[rgb(1,24,74)] px-6 h-10 rounded-3xl'>Home</button>

        </div>
        <div className='pt-[50px] pb-10'>
          <h1 className="text-2xl md:text-3xl xl:text-4xl mb-18 font-bold text-center text-[rgb(1,24,74)]">Crie sua conta</h1>
        </div>
        <div className='border border-gray-100 rounded-3xl p-6 shadow-lg'>
          <form onSubmit={handleSubmit(onSubmit)} className=" text-[rgb(1,24,74)] max-w-md sm:max-w-lg md:max-w-xl lg:max-w-[80%] mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-1 gap-x-9 md:gap-x-10 xl:gap-x-16">
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block  text-sm font-bold mb-2"
              >
                Nome completo
              </label>
              <input
                {...register("name")}
                type="text"
                id="name"
                placeholder="Digite seu nome completo"
                className={`shadow appearance-none border border-[rgb(1,24,74)] rounded w-full py-2 px-3  leading-tight focus:outline-none focus:shadow-outline ${errors.name ? "border-red-500" : ""}`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs italic">{errors.name.message}</p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="socialName"
                className="block  text-sm font-bold mb-2"
              >
                Nome Social
              </label>
              <input
                {...register("socialName")}
                type="text"
                id="socialName"
                className={`shadow appearance-none border border-[rgb(1,24,74)] rounded w-full py-2 px-3  leading-tight focus:outline-none focus:shadow-outline ${errors.socialName ? "border-red-500" : ""}`}
              />
              {errors.socialName && (
                <p className="text-red-500 text-xs italic">{errors.socialName.message}</p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block  text-sm font-bold mb-2"
              >
                E-mail
              </label>
              <input
                {...register("email")}
                type="email"
                id="email"
                placeholder="Digite seu email"
                className={`shadow appearance-none border border-[rgb(1,24,74)] rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs italic">{errors.email.message}</p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="cpf"
                className="block text-sm font-bold mb-2"
              >
                CPF
              </label>
              <input
                {...register("cpf")}
                type="text"
                id="cpf"
                placeholder="000.000.000-00"
                maxLength={11}
                pattern="\d{11}"
                className={`shadow appearance-none border border-[rgb(1,24,74)] rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${errors.cpf ? "border-red-500" : ""}`}
              />

              {errors.cpf && (
                <p className="text-red-500 text-xs italic">{errors.cpf.message}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="cel"
                className="block text-sm font-bold mb-2"
              >
                Celular
              </label>
              <input
                {...register("cel")}
                type="text"
                id="cel"
                maxLength={11}
                pattern="\d{11}"
                placeholder="11999999999"
                className={`shadow appearance-none border border-[rgb(1,24,74)] rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${errors.cel ? "border-red-500" : ""}`}
              />

              {errors.cel && (
                <p className="text-red-500 text-xs italic">{errors.cel.message}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="gender"
                className="block text-sm font-bold mb-2"
              >
                Gênero
              </label>
              <select
                {...register("gender")}
                id="gender"
                className={`shadow appearance-none border border-[rgb(1,24,74)] rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${errors.gender ? "border-red-500" : ""}`}
              >
                <option value="">SELECIONE</option>
                <option value="M">MASCULINO</option>
                <option value="F">FEMININO</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-xs italic">{errors.gender.message}</p>
              )}
            </div>
            <div className="mb-4">
              <label htmlFor="zipCode" className="block text-sm font-bold mb-2">CEP</label>
              <input
                {...register("address.zipCode")}
                id="zipCode"
                placeholder="00.000.000"
                maxLength={8}
                onChange={(e) => handleCepChange(e.target.value)}
                className={`shadow appearance-none border border-[rgb(1,24,74)] rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${errors.address?.zipCode ? "border-red-500" : ""}`}
              />
              {errors.address?.zipCode && (
                <p className="text-red-500 text-xs italic">{errors.address.zipCode.message}</p>
              )}
              {addressError && (
                <p className="text-red-500 text-xs italic">{addressError}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="street" className="block text-sm font-bold mb-2">Rua</label>
              <input
                {...register("address.street")}
                id="street"
                placeholder="Digite a rua"
                className={`shadow appearance-none border border-[rgb(1,24,74)] rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${errors.address?.street ? "border-red-500" : ""}`}
              />
              {errors.address?.street && (
                <p className="text-red-500 text-xs italic">{errors.address.street.message}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="number" className="block text-sm font-bold mb-2">Número</label>
              <input
                {...register("address.number")}
                id="number"
                placeholder="Digite o número"
                className={`shadow appearance-none border border-[rgb(1,24,74)] rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${errors.address?.number ? "border-red-500" : ""}`}
              />
              {errors.address?.number && (
                <p className="text-red-500 text-xs italic">{errors.address.number.message}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="complement" className="block text-sm font-bold mb-2">Complemento</label>
              <input
                {...register("address.complement")}
                id="complement"
                className={`shadow appearance-none border border-[rgb(1,24,74)] rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline`}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="neighborhood" className="block text-sm font-bold mb-2">Bairro</label>
              <input
                {...register("address.neighborhood")}
                id="neighborhood"
                placeholder="Digite o bairro"
                className={`shadow appearance-none border border-[rgb(1,24,74)] rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${errors.address?.neighborhood ? "border-red-500" : ""}`}
              />
              {errors.address?.neighborhood && (
                <p className="text-red-500 text-xs italic">{errors.address.neighborhood.message}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="city" className="block text-sm font-bold mb-2">Cidade</label>
              <input
                {...register("address.city")}
                id="city"
                placeholder="Digite a cidade"
                className={`shadow appearance-none border border-[rgb(1,24,74)] rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${errors.address?.city ? "border-red-500" : ""}`}
              />
              {errors.address?.city && (
                <p className="text-red-500 text-xs italic">{errors.address.city.message}</p>
              )}
            </div>



            <div className="mb-4">
              <label htmlFor="state" className="block text-sm font-bold mb-2">Estado</label>
              <select
                {...register("address.state")}
                id="state"
                className={`shadow appearance-none border border-[rgb(1,24,74)] rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${errors.address?.state ? "border-red-500" : ""}`}
              >
                <option value="">SELECIONE</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {errors.address?.state && (
                <p className="text-red-500 text-xs italic">{errors.address.state.message}</p>
              )}
            </div>

            {/* <div className="mb-4">
            <label htmlFor="zipCode" className="block text-sm font-bold mb-2">CEP</label>
            <input
              {...register("address.zipCode")}
              id="zipCode"
              className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${errors.address?.zipCode ? "border-red-500" : ""}`}
            />
            {errors.address?.zipCode && (
              <p className="text-red-500 text-xs italic">{errors.address.zipCode.message}</p>
            )}
          </div> */}



            <div className="mb-4">
              <label htmlFor="birthDate" className="block text-sm font-bold mb-2">Data de Nascimento</label>
              <input
                {...register("birthDate")}
                type="date"
                id="birthDate"
                className={`shadow appearance-none border border-[rgb(1,24,74)] rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${errors.birthDate ? "border-red-500" : ""}`}
              />
              {errors.birthDate && (
                <p className="text-red-500 text-xs italic">{errors.birthDate.message}</p>
              )}
            </div>


            <div className="mb-4">
              <label
                htmlFor="password"
                className="blocktext-sm font-bold mb-2"
              >
                Senha
              </label>
              <input
                {...register("password")}
                type="password"
                id="password"
                className={`shadow appearance-none border border-[rgb(1,24,74)] rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${errors.password ? "border-red-500" : ""}`}
              />
              {errors.password && (
                <p className="text-red-500 text-xs italic">{errors.password.message}</p>
              )}
            </div>
            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-bold mb-2"
              >
                Confirmar Senha
              </label>
              <input
                {...register("confirmPassword")}
                type="password"
                id="confirmPassword"
                className={`shadow appearance-none border border-[rgb(1,24,74)] rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${errors.confirmPassword ? "border-red-500" : ""}`}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs italic">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 py-8">
              <button
                type="submit"
                className="w-[120px] h-[60px] bg-[rgb(12,155,207)] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
              >
                Criar Conta
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 py-8">
              <Link href="/">
                <button
                  type="button"
                  className=" gap-4 w-[120px] h-[60px] bg-[rgb(137,191,82)] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                >
                  Voltar
                </button>
              </Link>
            </div>
          </form>
          {showModal && serverError && (
            <ErrorModal message={serverError} onClose={() => setShowModal(false)} />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default CreateAccountForm;