﻿using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure.Internal;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebRTC_Internship.Models
{
    public class Videochat
    {
        public long ID { get; set; }
        public string UUID { get; set; }
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
    }

    public class VideochatDBContext : DbContext
    {
        public DbSet<Videochat> Videochat { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlite("Data Source=Videochat.db");
        }
    }

    public class secondcontext : DbContext
    {
        public DbSet<Videochat> Videochat { get; set; }
        public secondcontext(DbContextOptions<secondcontext> options)
            : base(options)
        { }
    }
}
