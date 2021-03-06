using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CoreMovies.Data;
using CoreMovies.Web.Configuration;
using CoreMovies.Web.Hubs;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Swashbuckle.AspNetCore.Swagger;

namespace CoreMovies.Web
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddScoped<IMovieData, SqlMovieData>();

            services.AddDbContextPool<MovieDbContext>(options =>
            {
                var connection = Configuration.GetConnectionString("MovieDb");
                options.UseSqlServer(connection);
            });

            services.AddCors(setup =>
            {
                setup.AddPolicy("MovieGet", builder =>
                {
                    builder.WithMethods("get")
                            .WithOrigins("https://localhost:44324");

                });
            });

            services.AddSignalR(options =>
            {
                options.EnableDetailedErrors = true;
            });

            services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("movies", new Info { Title= "Movies", Version="v1" });
            });
            services.Configure<Greetings>(options =>
            {
                Configuration.Bind("Greetings", options);
            });
            
            services.Configure<CookiePolicyOptions>(options =>
            {
                // This lambda determines whether user consent for non-essential cookies is needed for a given request.
                options.CheckConsentNeeded = context => true;
                options.MinimumSameSitePolicy = SameSiteMode.None;
            });


            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_1);
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                app.UseHsts();
            }

            app.SetDefaultCsp();
            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseNodeModules(env);
            app.UseCookiePolicy();
            app.UseSwagger();
            app.UseSwaggerUI(setup =>
            {
                setup.SwaggerEndpoint("movies/swagger.json", "Movies API");
            });
            app.UseSignalR(config =>
            {
                config.MapHub<ChatHub>("/chat");
            });
            app.UseMvc();
        }
    }
}
